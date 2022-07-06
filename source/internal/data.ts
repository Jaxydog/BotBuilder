import { Awaitable } from "discord.js"
import FS from "fs/promises"
import { autoCatch } from "../utility/common"

/** Data action */
export type DataAction<T> = (data: T, id: string, storage: BaseStorage) => Awaitable<void>
/** Data modifier */
export type DataModifier<T> = (data: T, id: string, storage: BaseStorage) => Awaitable<T>
/** Data predicate */
export type DataPredicate<T> = (data: T, id: string, storage: BaseStorage) => Awaitable<boolean>

/** Storage configuration object */
export interface StorageOptions {
	/** File extension */
	extension?: string
	/** Tells the request to ignore the cache */
	noCache?: boolean
	/** Tells the request to ignore the file system */
	noFile?: boolean
}

/** Base storage class */
export abstract class BaseStorage {
	/** Default storage options */
	protected static readonly _defaultOptions: StorageOptions = { extension: "json" }
	/** Data directory */
	protected static readonly _rootPath = "./data"

	/**
	 * Converts a raw directory to a file path
	 * @param dir Raw directory
	 */
	protected static _dirPath(dir: string) {
		dir = dir.replace(/\\/g, "/")
		if (dir.startsWith("/")) dir = dir.slice(1)
		if (!dir.endsWith("/")) dir += "/"
		return `${this._rootPath}/${dir}`
	}
	/**
	 * Converts a raw identifier to a file path
	 * @param id Raw identifier
	 */
	protected static _idPath(id: string, extension = this._defaultOptions.extension ?? "json") {
		id = id.replace(/\\/g, "/")
		if (id.startsWith("/")) id = id.slice(1)
		if (id.endsWith(extension)) return `${this._rootPath}/${id}`
		else return `${this._rootPath}/${id}.${extension}`
	}

	/**
	 * Checks whether data exists at the given identifier
	 * @param id Identifier
	 * @param options Configuration
	 */
	public abstract has(id: string, options?: StorageOptions): Awaitable<boolean>
	/**
	 * Checks whether data exists at all given identifiers
	 * @param ids Identifiers
	 * @param options Configuration
	 */
	public async hasAll(ids: string[], options?: StorageOptions) {
		let result = true
		for (const id of ids) result &&= await this.has(id, options)
		return result
	}
	/**
	 * Checks whether data exists at any given identifiers
	 * @param ids Identifiers
	 * @param options Configuration
	 */
	public async hasAny(ids: string[], options?: StorageOptions) {
		let result = false
		for (const id of ids) result ||= await this.has(id, options)
		return result
	}

	/**
	 * Fetches the data at the given identifier, if it exists
	 * @param id Identifier
	 * @param options Configuration
	 */
	public abstract get<T>(id: string, options?: StorageOptions): Awaitable<T | undefined>
	/**
	 * Fetches the data at the given identifiers, if it exists
	 * @param ids Identifiers
	 * @param options Configuration
	 * @returns
	 */
	public async getAll<T>(ids: string[], options?: StorageOptions) {
		const result: [string, T | undefined][] = []
		for (const id of ids) result.push([id, await this.get(id, options)])
		return result
	}

	/**
	 * Stores the given data within the provided identifier
	 * @param id Identifier
	 * @param options Configuration
	 */
	public abstract set<T>(id: string, data: T, options?: StorageOptions): Awaitable<boolean>
	/**
	 * Stores all given data within the provided identifiers
	 * @param list List of identifiers and data values
	 * @param options Configuration
	 */
	public async setAll<T>(list: [string, T][], options?: StorageOptions) {
		let result = true
		for (const [id, data] of list) result &&= await this.set(id, data, options)
		return result
	}

	/**
	 * Deletes the data within the given identifier
	 * @param id Identifier
	 * @param options Configuration
	 */
	public abstract del(id: string, options?: StorageOptions): Awaitable<boolean>
	/**
	 * Deletes the data within the given identifiers
	 * @param ids Identifiers
	 * @param options Configuration
	 */
	public async delAll(ids: string[], options?: StorageOptions) {
		let result = true
		for (const id of ids) result &&= await this.del(id, options)
		return result
	}

	/**
	 * Fetches all identifiers and their data within the given directory
	 * @param dir Directory
	 * @param options Configuration
	 */
	public abstract list<T>(dir: string, options?: StorageOptions): Awaitable<[string, T][]>
	/**
	 * Fetches all identifiers within the given directory
	 * @param dir Directory
	 * @param options Configuration
	 */
	public async ids(dir: string, options: StorageOptions) {
		return (await this.list(dir, options)).map(([k]) => k)
	}
	/**
	 * Fetches all data within the given directory
	 * @param dir Directory
	 * @param options Configuration
	 */
	public async values<T>(dir: string, options: StorageOptions) {
		return (await this.list<T>(dir, options)).map(([, v]) => v)
	}

	/**
	 * Fetches the data within the identifier, saving it as the fallback if it does not exist
	 * @param id Identifier
	 * @param fallback Fallback value
	 * @param options Configuration
	 */
	public async ensure<T>(id: string, fallback: T, options?: StorageOptions) {
		if (this.has(id, options)) {
			return (await this.get<T>(id, options))!
		} else {
			await this.set<T>(id, fallback, options)
			return fallback
		}
	}

	/**
	 * Returns whether the requested data matches the given predicate, if it exists
	 * @param id Identifier
	 * @param predicate Predicate
	 * @param options Configuration
	 */
	public async expect<T>(id: string, predicate: DataPredicate<T>, options?: StorageOptions) {
		return (await this.has(id)) && (await predicate((await this.get(id, options))!, id, this))
	}
	/**
	 * Returns whether all of the requested data matches the given predicate, if it exists
	 * @param ids Identifiers
	 * @param predicate Predicate
	 * @param options Configuration
	 */
	public async expectAll<T>(ids: string[], predicate: DataPredicate<T>, options?: StorageOptions) {
		let result = true
		for (const id of ids) result &&= await this.expect(id, predicate, options)
		return result
	}
	/**
	 * Returns whether any of the requested data matches the given predicate, if it exists
	 * @param ids Identifiers
	 * @param predicate Predicate
	 * @param options Configuration
	 */
	public async expectAny<T>(ids: string[], predicate: DataPredicate<T>, options?: StorageOptions) {
		let result = false
		for (const id of ids) result ||= await this.expect(id, predicate, options)
		return result
	}

	/**
	 * Executes the given action on the requested data, if it exists
	 * @param id Identifier
	 * @param action Action
	 * @param options Configuration
	 */
	public async action<T>(id: string, action: DataAction<T>, options?: StorageOptions) {
		if (await this.has(id, options)) await action((await this.get(id, options))!, id, this)
	}
	/**
	 * Executes the given action on the requested data, if it exists and matches the provided predicate
	 * @param id Identifier
	 * @param action Action
	 * @param predicate Predicate
	 * @param options Configuration
	 */
	public async actionIf<T>(id: string, action: DataAction<T>, predicate: DataPredicate<T>, options?: StorageOptions) {
		if (await this.expect(id, predicate, options)) await action((await this.get(id, options))!, id, this)
	}
	/**
	 * Executes the given action on the requested data, if it exists
	 * @param ids Identifiers
	 * @param action Action
	 * @param options Configuration
	 */
	public async actionAll<T>(ids: string[], action: DataAction<T>, options?: StorageOptions) {
		for (const id of ids) await this.action(id, action, options)
	}
	/**
	 * Executes the given action on the requested data, if it exists and matches the provided predicate
	 * @param ids Identifiers
	 * @param action Action
	 * @param predicate Predicate
	 * @param options Configuration
	 */
	public async actionAllIf<T>(
		ids: string[],
		action: DataAction<T>,
		predicate: DataPredicate<T>,
		options?: StorageOptions
	) {
		for (const id of ids) await this.actionIf(id, action, predicate, options)
	}

	/**
	 * Modifies the requested data, if it exists
	 * @param id Identifier
	 * @param modify Modifier
	 * @param options Configuration
	 */
	public async modify<T>(id: string, modify: DataModifier<T>, options?: StorageOptions) {
		if (await this.has(id, options)) {
			const data = await modify((await this.get(id, options))!, id, this)
			return await this.set(id, data, options)
		} else return false
	}
	/**
	 * Modifies the requested data, if it exists and matches the provided predicate
	 * @param id Identifier
	 * @param modify modify
	 * @param predicate Predicate
	 * @param options Configuration
	 */
	public async modifyIf<T>(
		id: string,
		modify: DataModifier<T>,
		predicate: DataPredicate<T>,
		options?: StorageOptions
	) {
		if (await this.expect(id, predicate, options)) {
			const data = await modify((await this.get(id, options))!, id, this)
			return await this.set(id, data, options)
		} else return false
	}
	/**
	 * Modifies the requested data, if it exists
	 * @param ids Identifiers
	 * @param modify Modifier
	 * @param options Configuration
	 */
	public async modifyAll<T>(ids: string[], modify: DataModifier<T>, options?: StorageOptions) {
		let result = true
		for (const id of ids) result &&= await this.modify(id, modify, options)
		return result
	}
	/**
	 * Modifies the requested data, if it exists and matches the provided predicate
	 * @param ids Identifiers
	 * @param modify Modifier
	 * @param predicate Predicate
	 * @param options Configuration
	 */
	public async modifyAllIf<T>(
		ids: string[],
		modify: DataModifier<T>,
		predicate: DataPredicate<T>,
		options?: StorageOptions
	) {
		let result = true
		for (const id of ids) result &&= await this.modifyIf(id, modify, predicate, options)
		return result
	}
}
/** Cache storage */
export class CacheStorage extends BaseStorage {
	private readonly __storage = new Map<string, unknown>()

	public has(id: string, options?: StorageOptions) {
		if (options?.noCache) return false
		const path = CacheStorage._idPath(id, options?.extension)
		return this.__storage.has(path)
	}
	public get<T>(id: string, options?: StorageOptions) {
		if (options?.noCache) return
		const path = CacheStorage._idPath(id, options?.extension)
		return this.__storage.get(path) as T
	}
	public set<T>(id: string, data: T, options?: StorageOptions) {
		if (options?.noCache) return false
		const path = CacheStorage._idPath(id, options?.extension)
		this.__storage.set(path, data)
		return this.__storage.has(path)
	}
	public del(id: string, options?: StorageOptions) {
		if (options?.noCache) return false
		const path = CacheStorage._idPath(id, options?.extension)
		return this.__storage.delete(path)
	}
	public list<T>(dir: string, options?: StorageOptions): [string, T][] {
		if (options?.noCache) return []
		const path = CacheStorage._dirPath(dir)
		return [...this.__storage.entries()].filter(([k]) => k.startsWith(path)).map(([k, v]) => [k, v as T])
	}
}
/** File storage */
export class FileStorage extends BaseStorage {
	public async has(id: string, options?: StorageOptions | undefined) {
		if (options && options.noFile) return false
		const path = FileStorage._idPath(id, options?.extension)
		return (await autoCatch(FS.readFile(path))).result
	}
	public async get<T = string>(id: string, options?: StorageOptions | undefined) {
		if (options && options.noFile) return
		const path = FileStorage._idPath(id, options?.extension)
		const { content, result } = await autoCatch(FS.readFile(path, { encoding: "utf8" }))

		if (!result) return
		if (options && options.extension && options.extension !== "json") return content as unknown as T
		else return JSON.parse(content) as T
	}
	public async set<T>(id: string, data: T, options?: StorageOptions | undefined) {
		if (options && options.noFile) return false
		const path = FileStorage._idPath(id, options?.extension)
		const json = !options || !options.extension || options.extension === "json"
		const raw = json ? JSON.stringify(data, null, "\t") : `${data}`

		await autoCatch(FS.mkdir(path.slice(0, path.lastIndexOf("/"))))
		return (await autoCatch(FS.writeFile(path, raw, { encoding: "utf8" }))).result
	}
	public async del(id: string, options?: StorageOptions | undefined) {
		if (options && options.noFile) return false
		const path = FileStorage._idPath(id, options?.extension)
		return (await autoCatch(FS.rm(path))).result
	}
	public async list<T>(dir: string, options?: StorageOptions | undefined): Promise<[string, T][]> {
		if (options && options.noFile) return []
		const path = FileStorage._dirPath(dir)
		const { content, result } = await autoCatch(FS.readdir(path, { withFileTypes: true }))
		if (!result) return []

		const output: [string, T][] = []
		for (const dirent of content) {
			if (!dirent.isFile()) continue
			const id = `${path}${dirent.name}`
			const data = (await this.get<T>(id, options))!
			output.push([id, data])
		}
		return output
	}
}
/** Dual storage (cache + file system) */
export class DualStorage extends BaseStorage {
	private readonly __cache = new CacheStorage()
	private readonly __file = new FileStorage()

	public async has(id: string, options?: StorageOptions | undefined) {
		return this.__cache.has(id, options) || (await this.__file.has(id, options))
	}
	public async get<T>(id: string, options?: StorageOptions | undefined) {
		return this.__cache.get<T>(id, options) ?? (await this.__file.get(id, options))
	}
	public async set<T>(id: string, data: T, options?: StorageOptions | undefined) {
		return this.__cache.set(id, data, options) && (await this.__file.set(id, data, options))
	}
	public async del(id: string, options?: StorageOptions | undefined) {
		return this.__cache.del(id, options) && (await this.__file.del(id, options))
	}
	public async list<T>(dir: string, options?: StorageOptions | undefined) {
		return [...new Set([...this.__cache.list<T>(dir, options), ...(await this.__file.list<T>(dir, options))])]
	}
}
