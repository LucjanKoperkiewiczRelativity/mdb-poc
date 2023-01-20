import MDBReader from "mdb-reader";
import { bindable } from 'aurelia-framework';
import { TableData } from "models/table-data";

export class App {
	public message = 'MDB Reader PoC';
	private file: File;
	@bindable() public tables: TableData[] = [];
	@bindable() rowLimitBound = 100;
	@bindable() batchSizeBound = 100000;

	get rowLimit() { return Number(this.rowLimitBound); }
	get batchSize() { return Number(this.batchSizeBound); }

	@bindable() public columns: string[];
	@bindable() public extraTime: number;

	async onFileSelected(event: Event): Promise<void> {
		const target = event.target as HTMLInputElement;
		const files = target.files as FileList;
		this.file = files[0];
		this.columns = null;
		await this.readFile(this.file);
	}

	async reread(): Promise<void> {
		this.readFile(this.file);
	}

	private async readFile(file: File): Promise<void> {
		const reader = await this.getReader(file);

		const tableNames = reader.getTableNames();

		const tables: TableData[] = []
		tableNames.forEach((tableName, i) => {
			const table = new TableData();
			table.name = tableName;
			table.data = reader
				.getTable(tableName)
				.getData({
					rowLimit: this.rowLimit
				});

			tables[i] = table;
		});

		this.tables = tables;
	}

	async readExtraColumns(): Promise<void> {
		const startTime = performance.now();
		await this.readExtraColumnsInternal();
		const endTime = performance.now();
		this.extraTime = Math.round(endTime - startTime);
	}

	private async readExtraColumnsInternal (): Promise<void> {
		const columnDict = {};
		const reader = await this.getReader(this.file);

		const table = reader.getTable('export_extras');

		for (let i = 0; i < table.rowCount; i += this.batchSize) {
			const batch = table.getData({ rowOffset: i, rowLimit: this.batchSize });

			batch.forEach(row => {
				const columnName = row['theLabel'];
				columnDict[columnName.toString()] = columnName;
			});
		}

		const columnNames = [];
		for(var propertyName in columnDict) {
			columnNames.push(propertyName);
		}

		this.columns = columnNames;
	}

	private async getReader(file: File): Promise<MDBReader> {
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		return new MDBReader(buffer);
	}
}
