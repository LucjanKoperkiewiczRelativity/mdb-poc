import MDBReader from "mdb-reader";
import { bindable } from 'aurelia-framework';
import { TableData } from "models/table-data";

export class App {
  public message = 'MDB Reader PoC';
  private file: File;
  @bindable() public tables: TableData[] = [];

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
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

		const reader = new MDBReader(buffer);

		const tableNames = reader.getTableNames();

    const tables: TableData[] = []
    tableNames.forEach((tableName, i) => {
        const table = new TableData();
        table.name = tableName;
        table.data = reader.getTable(tableName).getData();

        tables[i] = table;
    });

    this.tables = tables;

    console.log('ok');
  }
}
