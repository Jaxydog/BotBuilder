import { BotClient } from ".."
import { autoCatch } from "../utility/common"

/** Clock callback */
export type ClockCallback = (client: BotClient) => Promise<void>

/** Handles regular event callbacks */
export class Clock {
	/** Callback arguments */
	private readonly __client: BotClient
	/** List of all callbacks */
	private readonly __callbacks = new Map<symbol, ClockCallback>()
	/** Active timer */
	private __timer?: NodeJS.Timer

	/** @param client Callback arguments */
	public constructor(client: BotClient) {
		this.__client = client
	}

	/** Starts the clock */
	public start() {
		this.stop()
		this.__timer = setInterval(() => this.run(), this.__client.cache.get("clock_delay")!)
	}
	/** Stops the clock */
	public stop() {
		clearInterval(this.__timer)
	}
	/**
	 * Adds a callback to the clock and returns its identifier
	 * @param callback Callback
	 */
	public add(callback: ClockCallback) {
		const id = Symbol("Timer callback")
		this.__callbacks.set(id, callback)
		return id
	}
	/**
	 * Removes a callback from the clock
	 * @param id Callback identifier
	 */
	public remove(id: symbol) {
		return this.__callbacks.delete(id)
	}
	/** Triggers all clock callbacks */
	public run() {
		return [...this.__callbacks.values()].map(async (c) => await autoCatch(c(this.__client)))
	}
}
