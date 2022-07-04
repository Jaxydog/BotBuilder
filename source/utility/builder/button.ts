import { EmojiIdentifierResolvable, MessageButton, MessageButtonStyleResolvable } from "discord.js"

/** Utility class for building buttons */
export class ButtonBuilder {
	/** Button instance */
	private __button = new MessageButton()

	/**
	 * Creates a builder from a button
	 * @param button Button instance
	 */
	public static from(button: MessageButton) {
		const builder = new ButtonBuilder()
		builder.__button = button
		return builder
	}

	/** Builds the button */
	public build() {
		return this.__button
	}
	/** Clones the builder */
	public clone() {
		return ButtonBuilder.from(this.build())
	}
	/**
	 * Sets the button's disabled status
	 * @param disabled Disabled
	 */
	public disabled(disabled: boolean) {
		this.__button.setDisabled(disabled)
		return this
	}
	/**
	 * Sets the button's emoji
	 * @param emoji Emoji
	 */
	public emoji(emoji: EmojiIdentifierResolvable) {
		this.__button.setEmoji(emoji)
		return this
	}
	/**
	 * Sets the button's custom identifier
	 * @param id Identifier
	 * @param data Additional data
	 */
	public id(id: string, data?: string) {
		if (data && `${id};${data}`.length <= 100) id += `;${data}`
		this.__button.setCustomId(id)
		return this
	}
	/**
	 * Sets the button's label
	 * @param label Label
	 */
	public label(label: string) {
		this.__button.setLabel(label)
		return this
	}
	/**
	 * Sets the button's style
	 * @param style Style
	 */
	public style(style: MessageButtonStyleResolvable) {
		this.__button.setStyle(style)
		return this
	}
	/**
	 * Sets the button's URL
	 * @param url URL
	 */
	public url(url: string) {
		this.__button.setURL(url)
		return this
	}
}
