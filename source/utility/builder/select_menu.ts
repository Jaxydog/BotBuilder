import { MessageSelectMenu, MessageSelectOptionData } from "discord.js"

/** Utility class for building select menus */
export class SelectMenuBuilder {
	/** Select menu instance */
	private __menu = new MessageSelectMenu()

	/**
	 * Creates a builder from a button
	 * @param selectMenu Button instance
	 */
	public static from(selectMenu: MessageSelectMenu) {
		const builder = new SelectMenuBuilder()
		builder.__menu = selectMenu
		return builder
	}

	/** Builds the select menu */
	public build() {
		return this.__menu
	}
	/** Clones the builder */
	public clone() {
		return SelectMenuBuilder.from(this.build())
	}
	/**
	 * Sets the select menu's disabled status
	 * @param disabled Disabled
	 */
	public disabled(disabled: boolean) {
		this.__menu.setDisabled(disabled)
		return this
	}
	/**
	 * Sets the select menu's custom identifier
	 * @param id Identifier
	 * @param data Additional data
	 */
	public id(id: string, data?: string) {
		if (data && `${id};${data}`.length <= 100) id += `;${data}`
		this.__menu.setCustomId(id)
		return this
	}
	/**
	 * Sets the select menu's maximum values
	 * @param max Maximum
	 */
	public max(max: number) {
		this.__menu.setMaxValues(max)
		return this
	}
	/**
	 * Sets the select menu's minimum values
	 * @param min Minimum
	 */
	public min(min: number) {
		this.__menu.setMinValues(min)
		return this
	}
	/**
	 * Adds an option to the select menu
	 * @param option Option
	 */
	public option(option: MessageSelectOptionData) {
		this.__menu.addOptions(option)
		return this
	}
	/**
	 * Sets the select menu's options
	 * @param options Options
	 */
	public options(...options: MessageSelectOptionData[]) {
		this.__menu.setOptions(...options)
		return this
	}
	/**
	 * Sets the select menu's placeholder
	 * @param placeholder Placeholder
	 */
	public placeholder(placeholder: string) {
		this.__menu.setPlaceholder(placeholder)
		return this
	}
}
