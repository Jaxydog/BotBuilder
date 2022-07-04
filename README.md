# BotBuilder

BotBuilder is a utility library for making the process of creating Discord bots a lot easier (and way less prone to outright crashing).

Through its client wrapper, BotBuilder provides methods for easily creating [buttons](#buttons), [application commands](#creating-an-application-command), [embeds](#embeds), [modals](#modals), [select menus](#select-menus), and [more](#other-features). The wrapper also includes a [local cache](#client-storage) for creating dynamic local variables on the fly, and a [storage module](#client-storage) that provides access to the file system (also with a cache, to keep the bot running fast).

## Installation

```
> npm i @jaxydog/botbuilder
```

## Setting up a bot client

### Client definition

BotBuilder clients can be created with the `BotClient` wrapper, and must be at least provided with a client token.
See [Client configuration](#client-configuration) for more client configuration options.

```ts
// *snip*

import { BotClient } from "@jaxydog/botbuilder"

const client = new BotClient({
	intents: ["DIRECT_MESSAGES", "GUILDS", "GUILD_MESSAGES"],
	token: "Your token here",
})

// *snip*

client.connect()
```

> Source: [examples/ping.ts](https://github.com/Jaxydog/BotBuilder/blob/main/example/ping.ts)

### Creating an application command

Creating application commands has been made as easy as possible while still allowing for as much complexity as vanilla Discord.js. To register a command, you must first `.define(...)` it and provide the structure that the BotWrapper will use to register it with the API.

Once the command is defined, you may use `.create(...)` to provide the interaction listener. This listener will only trigger when the interaction's `commandName` is equal to the provided string identifier. For a complete list of methods, see [ActionManager methods](#actionmanager-methods).

All interaction listeners are provided with an `ActionContext` object, which contains the interaction object, the bot client, [ID data](#builders), as well as some [utility functions](#actioncontext-methods).

```ts
// *snip*

client.action.command
	// `define` stores the structure of the command in memory
	.define("ping", {
		name: "ping",
		description: "Tests the bot's connection",
	})
	// `create` stores the event listener of the command in memory
	.create("ping", async (context) => {
		const reply = (await context.interaction.reply({
			content: "Calculating...",
			ephemeral: true,
			fetchReply: true,
		})) as Message

		const delay = reply.createdTimestamp - context.interaction.createdTimestamp

		await context.interaction.editReply({ content: `Pong! (${delay}ms)` })
	})

// *snip*
```

> Source: [examples/ping.ts](https://github.com/Jaxydog/BotBuilder/blob/main/example/ping.ts)

### Creating other interaction callbacks

The client wrapper also has the functionality to register callbacks for specific interaction types natively. These action managers are accessed through `client.action`, and do not require a `.define(...)` call.

```ts
client.action.button.create("button", async (context) => {
	// interaction callback
})
client.action.modal.create("modal", async (context) => {
	// interaction callback
})
client.action.selectMenu.create("select_menu", async (context) => {
	// interaction callback
})
```

### Utilizing the Clock

The BotClient provides you with an internal clock, which will regularly execute registered callbacks at the provided interval (see [client configuration](#client-configuration)). This can be used for updating the bot's status at regular intervals or performing other actions that need to occur regularly. The clock is automatically started once the client connects to the API.

If for some reason during runtime you need to remove a clock callback, it will return a symbol that you can use to remove it with `clock.remove(...)`. The clock can also be dynamically stopped and started, and you can trigger all callbacks at any point as well (this does not reset the clock timer).

```ts
client.clock.add(async (client) => {
	client.logger.info("This will be called every 30 seconds by default!")
})
```

### Client storage

The client wrapper includes a `.cache` property, which allows you to save and load local variables dynamically. These values are permanently deleted when the process is closed.

```ts
client.cache.set("id", { value: 123 })
client.cache.get<{ value: number }>("id") // => { value: 123 }
```

If you need a more permanent solution, then the `.storage` property is for you. It saves files locally to the disk, within the `./data` folder (which will be generated if it does not exist). It also includes its own built-in cache so it will be just as fast after the first load. The cache also provides the secondary purpose of behaving as a fallback in case data can't be found on the disk.

```ts
client.storage.set("id", { value: 321 })
client.storage.get<{ value: number }>("id") // => { value: 321 }
```

For all methods provided by storage instances, see [Storage methods](#storage-methods). For all storage options, see [Storage options](#storage-options).

## Builders

BotBuilder provides multiple classes that help make creating instances of certain objects less cluttered or confusing.

Most builders that contain a `.id(...)` method support data IDs, which allow the bot to share data across interactions. Keep in mind that custom IDs have a maximum size of 100 characters, so if the data exceeds that it will be ignored.

### Buttons

```ts
new ButtonBuilder()
	.id("button", "custom_data_max_100_chars")
	.style("PRIMARY")
	.emoji("🙂")
	.label("Clicky clicky")
	.build()
```

### Embeds

```ts
new EmbedBuilder()
	.color("BLURPLE")
	.author("Discord Bot")
	.title("Rich embed!")
	.description("💰 We're rich! 💰")
	.footer("Embed footer")
	.build()
```

### Modals

```ts
new ModalBuilder()
	.id("modal", "custom_data_max_100_chars")
	.title("My very cool epic modal")
	.field(
		new ModalFieldBuilder()
			.id("field")
			.style("SHORT")
			.label("Text field")
			.min(5)
			.max(100)
			.placeholder("Text value between 5 and 100 chars")
			.required(true)
			.build()
	)
	.build()
```

### Select Menus

```ts
new SelectMenuBuilder()
	.id("select_menu", "some_more_custom_data")
	.option({
		label: "First",
		value: "1",
	})
	.option({
		label: "Second",
		value: "2",
	})
	.option({
		label: "Third",
		value: "3",
	})
	.option({
		label: "Fourth",
		value: "4",
	})
	.option({
		label: "Fifth",
		value: "5",
	})
```

## Other features

### Client configuration

`clockInterval` - Clock interval in milliseconds; defaults to `30_000` (30 seconds)

`color` - Log color; defaults to `"#5865F2"`

`devGuilds` - Development guild identifiers; application commands are always updated here

`globalUpdate` - Whether to update global application commands; defaults to `false`

`intents` - Client intents bitfield

`name` - Bot name; used in logging and defaults to `"Discord Bot"`

`saveLogs` - Whether to save log files; defaults to `false`

`silent` - Disables logging when enabled; defaults to `false`

`token` - Client token

`version` - Bot version; used in logging

### ActionContext methods

`guild()` - Returns the interaction guild, throwing an error if it does not exist

`channel()` - Returns the interaction channel, throwing an error if it does not exist

`member()` - Returns a promise that resolves to the member instance of the user who created the interaction, throwing an error if it does not exist

`requirePermissions(...)` - Ensures that the interaction member has the required permissions, and throws an error if it does not

### ActionManager methods

`create(...)` - Creates an action callback

`invoke(...)` - Invokes an action callback

### DefinedActionManager methods

`create(...)` - Creates an action callback

`invoke(...)` - Invokes an action callback

`define(...)` - Defines a data structure

### Storage options

`extension` - File extension

`noCache` - Tells the request to ignore the cache

`noFile` - Tells the request to ignore the file system

### Storage methods

`has(...)` - Checks whether data exists at the given identifier

`hasAll(...)` - Checks whether data exists at all given identifiers

`hasAny(...)` - Checks whether data exists at any given identifiers

`get<T>(...)` - Fetches the data at the given identifier, if it exists

`getAll<T>(...)` - Fetches the data at the given identifiers, if it exists

`set<T>(...)` - Stores the given data within the provided identifier

`setAll<T>(...)` - Stores all given data within the provided identifiers

`del(...)` - Deletes the data within the given identifier

`delAll(...)` - Deletes the data within the given identifiers

`list<T>(...)` - Fetches all identifiers and their data within the given directory

`ids(...)` - Fetches all identifiers within the given directory

`values<T>(...)` - Fetches all data within the given directory

`ensure<T>(...)` - Fetches the data within the identifier, saving it as the fallback if it does not exist

`expect<T>(...)` - Returns whether the requested data matches the given predicate, if it exists

`expectAll<T>(...)` - Returns whether all of the requested data matches the given predicate, if it exists

`expectAny<T>(...)` - Returns whether any of the requested data matches the given predicate, if it exists

`action<T>(...)` - Executes the given action on the requested data, if it exists

`actionIf<T>(...)` - Executes the given action on the requested data, if it exists and matches the provided predicate

`actionAll<T>(...)` - Executes the given action on the requested data, if it exists

`actionAllIf<T>(...)` - Executes the given action on the requested data, if it exists and matches the provided predicate

`modify<T>(...)` - Modifies the requested data, if it exists

`modifyIf<T>(...)` - Modifies the requested data, if it exists and matches the provided predicate

`modifyAll<T>(...)` - Modifies the requested data, if it exists

`modifyAllIf<T>(...)` - Modifies the requested data, if it exists and matches the provided predicate
