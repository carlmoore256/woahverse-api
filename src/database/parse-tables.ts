import { parseColumns, ITableColumn } from './sql-helpers';
import { DatabaseClient } from './DatabaseClient';
import { DatabaseTable } from './DatabaseTable';

export async function parseTables(sql: string, client: DatabaseClient): Promise<{ [key: string]: ITable }> {
    const tableStrings = sql.split(';');
    const tables: { [key: string]: ITable } = {};

    
    for (const cur of tableStrings) {
        const tableName = cur.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
        if (tableName) {
            const name = tableName[1];
            const columns = parseColumns(cur);
            // Debug.log(`trying to create database table ${name}`, LogColor.Yellow);
            // const primaryKey = await client.getPrimaryKeyOfTable(name) || columns[0].key;
            const primaryKey = columns.find(c => c.primary)?.key || columns[0].key;
            const table = new DatabaseTable(client.db, name);
            const createQuery = cur + ';';
            tables[name] = {
                name,
                table,
                createQuery,
                columns,
                primaryKey,
                insert: async (data: any) => table.insert(data),
                insertMany: async (data: any[]) => table.insertMany(data),
                upsert: async (data: any) => table.upsert(data, primaryKey),
                upsertMany: async (data: any[]) => table.upsertMany(data, primaryKey),
                query: async (query: Partial<any>) => table.query(query),
                selectOne: async (query: Partial<any>) => table.selectOne(query),
                getAll: async () => table.getAll(),
                getById: async (id: string) => table.getById(id),
                delete: async (query: Partial<any>) => table.delete(query),
                deleteById: async (id: string) => table.deleteById(id),
                truncate: async () => table.truncate(),
                reset: async () => table.reset(createQuery),
            }
        }
    }
    return tables;
}


export interface ITable {
    name: string;
    table: DatabaseTable;
    createQuery: string;
    columns: ITableColumn[],
    primaryKey?: string;
    insert: (data: any) => Promise<any>;
    insertMany: (data: any[]) => Promise<any>,
    upsert: (data: any) => Promise<any>,
    upsertMany: (data: any[]) => Promise<any>,
    query: (query: Partial<any>) => Promise<any[]>,
    selectOne: (query: Partial<any>) => Promise<any>,
    getAll: () => Promise<any[]>,
    getById: (id: string) => Promise<any>,
    delete: (query: Partial<any>) => Promise<boolean>,
    deleteById: (id: string) => Promise<boolean>,
    truncate: () => Promise<void>,
    reset: () => Promise<void>,
}
