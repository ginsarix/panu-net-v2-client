import { nanoid } from 'nanoid';

export const createUniqueFilename = (filename: string, extension: string) => {
  return `${filename}_${nanoid(12)}.${extension}`;
};
