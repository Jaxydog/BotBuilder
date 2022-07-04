import { Message } from "discord.js"
import { BotClient } from "../source/index"

const client = new BotClient({
	intents: ["DIRECT_MESSAGES", "GUILDS", "GUILD_MESSAGES"],
	token: "Your token here",
})

client.action.command
	.define("ping", {
		name: "ping",
		description: "Tests the bot's connection",
	})
	.create("ping", async (context) => {
		const reply = (await context.interaction.reply({
			content: "Calculating...",
			ephemeral: true,
			fetchReply: true,
		})) as Message

		const delay = reply.createdTimestamp - context.interaction.createdTimestamp

		await context.interaction.editReply({ content: `Pong! (${delay}ms)` })
	})

client.connect()
