import Logger, { Level, Rule } from "@jaxydog/clogts"
import dayjs from "dayjs"
import { BitFieldResolvable, Client, IntentsString } from "discord.js"
import {
	ButtonActionManager,
	CommandActionManager,
	ModalActionManager,
	SelectMenuActionManager,
} from "./internal/action"
import { Clock } from "./internal/clock"
import { CacheStorage, DualStorage } from "./internal/data"

export * from "./internal/action"
export * from "./internal/clock"
export * from "./internal/data"

export * from "./utility/common"
export * from "./utility/builder/button"
export * from "./utility/builder/component"
export * from "./utility/builder/embed"
export * from "./utility/builder/modal"
export * from "./utility/builder/select_menu"

/** Client configuration */
export interface Config {
	/** Clock interval in milliseconds; defaults to `30_000` (30 seconds) */
	clockInterval?: number
	/** Log color; defaults to `"#5865F2"` */
	color?: string
	/** Development guild identifiers; application commands are always updated here */
	devGuilds?: string[]
	/** Whether to update global application commands; defaults to `false` */
	globalUpdate?: boolean
	/** Client intents bitfield */
	intents?: BitFieldResolvable<IntentsString, number>
	/** Bot name; defaults to `"Discord Bot"` */
	name?: string
	/** Whether to save log files; defaults to `false` */
	saveLogs?: boolean
	/** Disables logging when enabled; defaults to `false` */
	silent?: boolean
	/** Client token */
	token: string
	/** Bot version; used in logging */
	version?: string
}

/** Bot client wrapper */
export class BotClient {
	/** Button action manager */
	private readonly __buttonManager: ButtonActionManager
	/** Command action manager */
	private readonly __commandManager: CommandActionManager
	/** Modal action manager */
	private readonly __modalManager: ModalActionManager
	/** Select menu action manager */
	private readonly __selectMenuManager: SelectMenuActionManager

	/** Local storage cache; used for dynamic internal variables and separate from main storage */
	public readonly cache = new CacheStorage()
	/** Discord client object */
	public readonly client: Client
	/** Handles regularly timed callback invocation */
	public readonly clock: Clock
	/** Handles console output and log saving */
	public readonly logger: Logger
	/** Main storage instance; has access to a cache and a file system */
	public readonly storage = new DualStorage()

	/** @param config Client configuration */
	public constructor(config: Config) {
		this.cache.set("token", config.token)
		this.cache.set("cmd_guilds", config.devGuilds ?? [])
		this.cache.set("cmd_global", config.globalUpdate ?? false)
		this.cache.set("log_color", config.color ?? "#5865F2")
		this.cache.set("log_name", config.name ?? "Discord Bot")
		this.cache.set("log_store", config.saveLogs ?? false)
		this.cache.set("log_silent", config.silent ?? false)
		this.cache.set("log_version", config.version ? " v" + config.version : "")
		this.cache.set("clock_delay", config.clockInterval ?? 30_000)

		this.client = new Client({ intents: config.intents ?? [] })
		this.clock = new Clock(this)
		this.logger = this.__createLogger()

		this.__buttonManager = new ButtonActionManager(this)
		this.__commandManager = new CommandActionManager(this)
		this.__modalManager = new ModalActionManager(this)
		this.__selectMenuManager = new SelectMenuActionManager(this)
	}

	/** Handles interaction callbacks */
	public get action() {
		return {
			/** Manages button interactions */
			button: this.__buttonManager,
			/** Manages command interactions */
			command: this.__commandManager,
			/** Manages modal interactions */
			modal: this.__modalManager,
			/** Manages select menu interactions */
			selectMenu: this.__selectMenuManager,
		}
	}

	/** Creates a new logger */
	private __createLogger() {
		const logger = new Logger()
		const color = this.cache.get<`#${string}`>("log_color")!
		const name = this.cache.get<string>("log_name")!
		const version = this.cache.get<string>("log_version")!

		logger.enabled = this.cache.get("log_silent")!
		logger.store = this.cache.get("log_store")!

		logger.colors.create("main", color)
		logger.colors.create("other", "gray-bright")
		logger.colors.create("other-dim", "gray")
		logger.colors.create("info", "blue-bright")
		logger.colors.create("warn", "yellow-bright")
		logger.colors.create("error", "red-bright")

		logger.props.create(Level.All, () => `[${name}${version}]`, new Rule(/.+/, "main"))
		logger.props.create(
			Level.All,
			() => `${dayjs().format("DD-MM-YY HH:mm:ss:SSS")}`,
			new Rule(/\d+/g, "other"),
			new Rule(/:|-/g, "other-dim")
		)
		logger.props.create(Level.Info, () => "->", new Rule(/->/g, "info"))
		logger.props.create(Level.Warn, () => "->", new Rule(/->/g, "warn"))
		logger.props.create(Level.Error, () => "->", new Rule(/->/g, "error"))

		return logger
	}

	/** Connect to the Discord API */
	public async connect() {
		this.client.once("ready", async () => {
			this.logger.info(`Connected to API: ${this.client.user!.tag}`)
			await this.__commandManager.update()
			this.clock.start()
		})

		await this.client.login(this.cache.get("token")!)
	}
}
