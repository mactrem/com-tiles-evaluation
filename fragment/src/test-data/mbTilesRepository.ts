import { Database, OPEN_READONLY } from "sqlite3";
import { promisify } from "util";

export interface TileRecord {
    zoom: number;
    column: number;
    row: number;
    data: Uint8Array;
}

export interface TileInfoRecord extends Omit<TileRecord, "data"> {
    size: number;
}

export class MBTilesRepository {
    private static readonly METADATA_TABLE_NAME = "metadata";
    private static readonly TILES_TABLE_NAME = "tiles";

    private constructor(private readonly db: Database) {}

    static async create(fileName: string): Promise<MBTilesRepository> {
        const db = await MBTilesRepository.connect(fileName);
        return new MBTilesRepository(db);
    }


    /**
     * Ordered by tileRow and tileColumn in ascending order which corresponds to row-major order.
     * */
    async getByteLengthOfTilesByRowMajorOrder(
        maxZoom: number
    ): Promise<TileInfoRecord[]> {
        const selectStatement = `SELECT zoom_level as zoom, tile_column as column, tile_row as row, length(tile_data) as size FROM ${MBTilesRepository.TILES_TABLE_NAME} WHERE zoom_level <= ${maxZoom}`;
        return this.getTiles(selectStatement);
    }

    async getTile(zoom: number, row: number, column: number): Promise<TileRecord> {
        const query = `SELECT tile_column as column, tile_row as row, tile_data as data  FROM ${MBTilesRepository.TILES_TABLE_NAME} WHERE zoom_level = ${zoom} AND tile_column = ${column} AND tile_row = ${row};`;
        return promisify(this.db.get.bind(this.db))(query);
    }

    async dispose(): Promise<void> {
        return promisify(this.db.close.bind(this.db))();
    }

    private getTiles(selectStatement: string) {
        selectStatement += " ORDER BY tile_row, tile_column ASC;";
        return promisify(this.db.all.bind(this.db))(selectStatement);
    }

    private static connect(dbPath: string): Promise<Database> {
        return new Promise<Database>((resolve, reject) => {
            const db = new Database(dbPath, OPEN_READONLY, (err) => {
                if (err) {
                    reject(err.message);
                    return;
                }

                resolve(db);
            });
        });
    }
}