import { MessageActionRow, MessageActionRowComponentResolvable } from "discord.js"

/** Utility class for building message components */
export class ComponentBuilder {
	/** List of components */
	private __components: MessageActionRowComponentResolvable[] = []

	/**
	 * Creates a builder from a list of components
	 * @param components Components
	 */
	public static from(...components: MessageActionRowComponentResolvable[]) {
		const builder = new ComponentBuilder()
		builder.__components = components
		return builder
	}

	/** Builds the component */
	public build(): MessageActionRow[] {
		const result: MessageActionRow[] = []
		const rows = [...this.__components]

		while (rows.length > 0 && rows.length < 5) {
			const components = rows.splice(0, 5)
			const row = new MessageActionRow().addComponents(...components)

			rows.push(row)
		}

		return result
	}
	/** Clones the builder */
	public clone() {
		return ComponentBuilder.from(...this.__components)
	}
	/**
	 * Adds a component to the component
	 * @param component Component
	 */
	public component(component: MessageActionRowComponentResolvable) {
		this.__components.push(component)
		return this
	}
	/**
	 * Sets the component's components
	 * @param components Component
	 */
	public components(...components: MessageActionRowComponentResolvable[]) {
		this.__components = []
		this.__components.push(...components)
		return this
	}
}
