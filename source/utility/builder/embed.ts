import { ColorResolvable, EmbedFieldData, MessageEmbed } from "discord.js"

/** Utility class for building embeds */
export class EmbedBuilder {
	/** Embed instance */
	private __embed = new MessageEmbed()

	/**
	 * Creates a builder from an embed
	 * @param embed Embed instance
	 */
	public static from(embed: MessageEmbed) {
		const builder = new EmbedBuilder()
		builder.__embed = embed
		return builder
	}

	/** Builds the embed */
	public build() {
		return this.__embed
	}
	/** Clones the builder */
	public clone() {
		return EmbedBuilder.from(this.build())
	}
	/**
	 * Sets the embed's author
	 * @param name Name
	 * @param iconURL Icon URL
	 * @param url URL
	 */
	public author(name: string, iconURL = "", url = "") {
		this.__embed.setAuthor({ name, iconURL, url })
		return this
	}
	/**
	 * Sets the embed's color
	 * @param color Color
	 */
	public color(color: ColorResolvable) {
		this.__embed.setColor(color)
		return this
	}
	/**
	 * Sets the embed's description
	 * @param description Description
	 */
	public description(description: string) {
		this.__embed.setDescription(description)
		return this
	}
	/**
	 * Adds a field to the embed
	 * @param field Field
	 */
	public field(field: EmbedFieldData) {
		this.__embed.addField(field.name, field.value, field.inline)
		return this
	}
	/**
	 * Sets the embed's fields
	 * @param fields Fields
	 */
	public fields(...fields: EmbedFieldData[] | EmbedFieldData[][]) {
		this.__embed.setFields(...fields)
		return this
	}
	/**
	 * Sets the embed's footer
	 * @param text Text
	 * @param iconURL Icon URL
	 */
	public footer(text: string, iconURL = "") {
		this.__embed.setFooter({ text, iconURL })
		return this
	}
	/**
	 * Sets the embed's image
	 * @param url URL
	 */
	public image(url: string) {
		this.__embed.setImage(url)
		return this
	}
	/**
	 * Sets the embed's thumbnail
	 * @param url URL
	 */
	public thumbnail(url: string) {
		this.__embed.setThumbnail(url)
		return this
	}
	/**
	 * Sets the embed's timestamp
	 * @param timestamp Timestamp
	 */
	public timestamp(timestamp?: number | Date | null) {
		this.__embed.setTimestamp(timestamp)
	}
	/**
	 * Sets the embed's title
	 * @param title Title
	 */
	public title(title: string) {
		this.__embed.setTitle(title)
		return this
	}
}
