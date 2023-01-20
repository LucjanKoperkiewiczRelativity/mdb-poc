import MDBReader from "mdb-reader";
import { bindable } from 'aurelia-framework';
import { TableData } from "models/table-data";

export class App {
	public message = 'MDB Reader PoC';
	private file: File;
	@bindable() public tables: TableData[] = [];
	@bindable() rowLimit = 100;
	@bindable() public columns: string[];
	@bindable() public extraTime: number;

	async onFileSelected(event: Event): Promise<void> {
		const target = event.target as HTMLInputElement;
		const files = target.files as FileList;
		this.file = files[0];
		this.readFile(this.file);
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
		this.extraTime = endTime - startTime;
	}

	private async readExtraColumnsInternal (): Promise<void> {
		const columnDict = {};
		const reader = await this.getReader(this.file);
		const batchSize = 1000;

		const table = reader.getTable('export_extras');

		for (let i = 0; i < table.rowCount; i += batchSize) {
			const batch = table.getData({ rowOffset: i, rowLimit: batchSize });

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
