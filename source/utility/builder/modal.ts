import {
	MessageActionRow,
	Modal,
	ModalActionRowComponent,
	TextInputComponent,
	TextInputStyleResolvable,
} from "discord.js"

/** Utility class for building modals */
export class ModalBuilder {
	/** Modal instance */
	private __modal = new Modal()
	/** List of components */
	private __rows: MessageActionRow<ModalActionRowComponent>[] = []

	/**
	 * Creates a builder from a modal
	 * @param modal Modal instance
	 */
	public static from(modal: Modal) {
		const builder = new ModalBuilder()
		builder.__modal = modal
		builder.__rows = modal.components.slice(0, 5)
		return builder
	}

	/** Builds the modal */
	public build() {
		this.__modal.setComponents(...this.__rows)
		return this.__modal
	}
	/** Clones the builder */
	public clone() {
		return ModalBuilder.from(this.build())
	}
	/**
	 * Adds a field to the modal
	 * @param field Field
	 */
	public field(field: ModalActionRowComponent) {
		if (this.__rows.length >= 5) this.__rows.shift()
		this.__rows.push(new MessageActionRow<ModalActionRowComponent>().addComponents(field))
		return this
	}
	/**
	 * Sets the modal's fields
	 * @param fields Fields
	 */
	public fields(...fields: ModalActionRowComponent[]) {
		this.__rows = []
		fields.forEach((f) => this.field(f))
		return this
	}
	/**
	 * Sets the modal's custom identifier
	 * @param id Identifier
	 * @param data Additional data
	 */
	public id(id: string, data?: string) {
		if (data && `${id};${data}`.length <= 100) id += `;${data}`
		this.__modal.setCustomId(id)
		return this
	}
	/**
	 * Sets the modal's title
	 * @param title Title
	 */
	public title(title: string) {
		this.__modal.setTitle(title)
		return this
	}
}

/** Utility class for building modal fields */
export class ModalFieldBuilder {
	/** Field instance */
	private __field = new TextInputComponent()

	/**
	 * Creates a builder from a modal field
	 * @param field Modal field instance
	 */
	public static from(field: TextInputComponent) {
		const builder = new ModalFieldBuilder()
		builder.__field = field
		return builder
	}

	/** Builds the modal field */
	public build() {
		return this.__field
	}
	/** Clones the builder */
	public clone() {
		return ModalFieldBuilder.from(this.build())
	}
	/**
	 * Sets the modal's custom identifier
	 * @param id Identifier
	 */
	public id(id: string) {
		this.__field.setCustomId(id)
		return this
	}
	/**
	 * Sets the modal field's label
	 * @param label Label
	 */
	public label(label: string) {
		this.__field.setLabel(label)
		return this
	}
	/**
	 * Sets the modal field's maximum length
	 * @param max Maximum
	 */
	public max(max: number) {
		this.__field.setMaxLength(max)
		return this
	}
	/**
	 * Sets the modal field's minimum length
	 * @param min Minimum
	 */
	public min(min: number) {
		this.__field.setMinLength(min)
		return this
	}
	/**
	 * Sets the modal field's placeholder text
	 * @param placeholder Placeholder
	 */
	public placeholder(placeholder: string) {
		this.__field.setPlaceholder(placeholder)
		return this
	}
	/**
	 * Sets the modal field to be required
	 * @param required Required
	 */
	public required(required: boolean) {
		this.__field.setRequired(required)
		return this
	}
	/**
	 * Sets the modal field's style
	 * @param style Style
	 */
	public style(style: TextInputStyleResolvable) {
		this.__field.setStyle(style)
		return this
	}
	/**
	 * Sets the modal field's default value
	 * @param value Value
	 */
	public value(value: string) {
		this.__field.setValue(value)
		return this
	}
}
