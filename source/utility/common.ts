/** Result from an `autoCatch(...)` call */
export type AutoCatchResult<T> = AutoCatchFailure | AutoCatchSuccess<T>

/** Successful await from an `autoCatch(...)` call */
export interface AutoCatchSuccess<T> {
	result: true
	content: T
}
/** Failed await from an `autoCatch(...)` call */
export interface AutoCatchFailure {
	result: false
	content: null
	error: unknown
}

/**
 * Automatically awaits and catches a possibly failed promise that throws an error
 * @param promise Promise to await
 */
export async function autoCatch<T>(promise: Promise<T>): Promise<AutoCatchResult<T>> {
	try {
		return { result: true, content: await promise }
	} catch (error) {
		return { result: false, content: null, error }
	}
}
