import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v10"
import {
	ApplicationCommandDataResolvable,
	ButtonInteraction,
	CommandInteraction,
	Interaction,
	ModalSubmitInteraction,
	PermissionResolvable,
	SelectMenuInteraction,
} from "discord.js"
import { BotClient } from ".."
import { EmbedBuilder } from "../utility/builder/embed"

/** Action callback */
export type ActionCallback<I extends Interaction> = (context: ActionContext<I>) => Promise<void>

/** Provides utility methods for interactions */
export class ActionContext<I extends Interaction> {
	/** Bot client */
	public readonly client: BotClient
	/** ID data */
	public readonly data: string[]
	/** Interaction */
	public readonly interaction: I

	/**
	 * @param client Bot client
	 * @param interaction Interaction
	 */
	public constructor(client: BotClient, interaction: I, data?: string[]) {
		this.client = client
		this.data = data ?? []
		this.interaction = interaction
	}

	/** Interaction guild */
	public guild() {
		if (!this.interaction.guild) throw "Missing guild"
		return this.interaction.guild
	}
	/** Interaction channel */
	public channel() {
		if (!this.interaction.channel) throw "Missing channel"
		return this.interaction.channel
	}
	/** Interaction member */
	public async member() {
		if (!this.interaction.member) throw "Missing member"
		return this.guild().members.fetch(this.interaction.member.user.id)
	}
	/** Ensure the interaction guild member has the required permissions */
	public async requirePermissions(...permissions: PermissionResolvable[]) {
		if (!this.interaction.memberPermissions) throw "Missing permissions"

		for (const permission of permissions) {
			if (!this.interaction.memberPermissions.has(permission)) throw `Missing permission: ${permission}`
		}
	}
}

/** Manages interaction responses */
export abstract class ActionManager<I extends Interaction> {
	/** Bot client */
	protected readonly _client: BotClient
	/** Action callbacks */
	protected readonly _callbacks = new Map<string, ActionCallback<I>>()

	/** @param client Bot client */
	public constructor(client: BotClient) {
		this._client = client
		this._createListener()
	}

	/** Creates an event listener on the manager's client */
	protected abstract _createListener(): void

	/**
	 * Creates an action callback
	 * @param id Identifier
	 * @param callback Callback
	 */
	public create(id: string, callback: ActionCallback<I>) {
		if (id.includes(";")) id = id.split(";")[0]!
		if (!this._callbacks.has(id)) this._callbacks.delete(id)

		this._callbacks.set(id, callback)
		return this
	}
	/**
	 * Invokes an action callback
	 * @param id Identifier
	 * @param interaction Interaction
	 */
	public async invoke(id: string, interaction: I) {
		const rawId = id.includes(";") ? id.split(";")[0]! : id
		const data = id.split(";").slice(1)

		const context = new ActionContext<I>(this._client, interaction, data)

		if (this._callbacks.has(rawId)) {
			try {
				const callback = this._callbacks.get(rawId)!
				await callback(context)

				this._client.logger.info(`Invoked action: ${rawId}`)
			} catch (error) {
				this._client.logger.error(`Error invoking action: ${rawId}\n\t-> ${error}`)

				try {
					if (!interaction.isRepliable()) throw "Action is not replyable"

					const embed = new EmbedBuilder()
						.color("RED")
						.title(`Error invoking action: ${rawId}`)
						.description(`> ${error}`)
						.build()

					if (interaction.deferred) {
						if (!interaction.ephemeral) throw "Defer is not ephemeral"
						await interaction.followUp({ embeds: [embed], ephemeral: true })
					} else {
						await interaction.reply({ embeds: [embed], ephemeral: true })
					}
				} catch (error) {
					this._client.logger.error(`Error sending error embed: ${rawId}\n\t-> ${error}`)
				}
			}
		} else {
			this._client.logger.warn(`Missing callback: ${rawId}, ${interaction.type}`)
		}
	}
}
/** Manages structured interaction responses */
export abstract class DefinedActionManager<I extends Interaction, D> extends ActionManager<I> {
	protected _definitions = new Map<string, D>()

	/**
	 * Defines a data structure
	 * @param id Identifier
	 * @param data Structure
	 */
	public define(id: string, data: D) {
		if (id.includes(";")) id = id.split(";")[0]!
		if (this._definitions.has(id)) this._definitions.delete(id)

		this._definitions.set(id, data)
		return this
	}

	public override create(id: string, callback: ActionCallback<I>) {
		if (id.includes(";")) id = id.split(";")[0]!
		if (this._definitions.has(id)) super.create(id, callback)
		else throw `Missing definition: ${id}`
		return this
	}
}

/** Button action manager */
export class ButtonActionManager extends ActionManager<ButtonInteraction> {
	protected _createListener() {
		this._client.client.on("interactionCreate", (interaction) => {
			if (!interaction.isButton()) return

			const rawId = interaction.customId.includes(";")
				? interaction.customId.split(";")[0]!
				: interaction.customId

			this.invoke(rawId, interaction)
		})
	}
}
/** Command action manager */
export class CommandActionManager extends DefinedActionManager<CommandInteraction, ApplicationCommandDataResolvable> {
	protected override _createListener() {
		this._client.client.on("interactionCreate", (interaction) => {
			if (!interaction.isCommand()) return
			this.invoke(interaction.commandName, interaction)
		})
	}

	/**
	 * Update application commands
	 * @param token Bot token
	 * @param guilds Dev guilds
	 * @param global Whether to update commands globally
	 */
	public async update() {
		const token = this._client.cache.get<string>("token")!
		const guilds = this._client.cache.get<string[]>("cmd_guilds")!
		const global = this._client.cache.get<boolean>("cmd_global")!

		const body = [...this._definitions.values()]
		const rest = new REST({ version: "10" }).setToken(token)

		try {
			const userId = this._client.client.user!.id

			for (const guildId of guilds) {
				const route = Routes.applicationGuildCommands(userId, guildId)
				await rest.put(route, { body })
			}

			this._client.logger.info(`Updated ${body.length} commands in ${guilds.length} guilds`)

			if (global) {
				const route = Routes.applicationCommands(userId)
				await rest.put(route, { body })

				this._client.logger.info(`Updated ${body.length} global commands`)
			}
		} catch (error) {
			this._client.logger.warn(`Error while refreshing application commands\n\t-> ${error}`)
		}
	}
}
/** Modal action manager */
export class ModalActionManager extends ActionManager<ModalSubmitInteraction> {
	protected override _createListener() {
		this._client.client.on("interactionCreate", (interaction) => {
			if (!interaction.isModalSubmit()) return

			const rawId = interaction.customId.includes(";")
				? interaction.customId.split(";")[0]!
				: interaction.customId

			this.invoke(rawId, interaction)
		})
	}
}
/** Select menu action manager */
export class SelectMenuActionManager extends ActionManager<SelectMenuInteraction> {
	protected override _createListener() {
		this._client.client.on("interactionCreate", (interaction) => {
			if (!interaction.isSelectMenu()) return

			const rawId = interaction.customId.includes(";")
				? interaction.customId.split(";")[0]!
				: interaction.customId

			this.invoke(rawId, interaction)
		})
	}
}
