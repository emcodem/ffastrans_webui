import Nedb = require('nedb');
export declare class AsyncNedb<G> extends Nedb<G> {
    constructor(pathOrOptions?: string | Nedb.DataStoreOptions | undefined);
    asyncFind<T extends G>(query: any, projection?: T): Promise<T[]>;
    asyncCount(query: any): Promise<unknown>;
    asyncFindOne<T extends G>(query: any, projection?: T): Promise<T>;
    asyncInsert<T extends G>(newDoc: T): Promise<T>;
    asyncUpdate(query: any, updateQuery: any, options?: Nedb.UpdateOptions): Promise<unknown>;
    asyncRemove(query: any, options?: Nedb.RemoveOptions): Promise<unknown>;
    asyncEnsureIndex(options: Nedb.EnsureIndexOptions): Promise<void>;
    asyncRemoveIndex(fieldName: string): Promise<void>;
    asyncLoadDatabase(): Promise<unknown>;
}
export default AsyncNedb;
