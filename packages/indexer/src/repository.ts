import { LastSyncedHeightRepository } from '@therne/hype';
import { promises as fs } from 'fs';

const EOF_NEWLINE = '\n';

export const saveLastSyncedHeightInJSON = (
  initialHeight: number,
  jsonFilePath: string,
): LastSyncedHeightRepository => ({
  async load(): Promise<number> {
    try {
      const data = await fs.readFile(jsonFilePath, { encoding: 'utf8' });
      const json = JSON.parse(data);
      return json.lastSyncedHeight;
    } catch (error) {
      // file not found
      return initialHeight;
    }
  },
  async save(height: number): Promise<void> {
    const data =
      JSON.stringify({ lastSyncedHeight: height }, null, 2) + EOF_NEWLINE;
    await fs.writeFile(jsonFilePath, data, { encoding: 'utf8' });
  },
});
