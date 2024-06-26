import keccak256 from 'keccak256';
import Web3, { Bytes, HexString } from 'web3';

export interface ParsedEvent<T> {
  signature: HexString;
  decode: (web3: Web3, data: Bytes, topics: Bytes[]) => T;
}

export const parseEventPrototype = <T>(prototype: string): ParsedEvent<T> => {
  const [name, parameters] = prototype.split('(');
  const parameterList = parameters
    .replace(')', '')
    .split(',')
    .filter((v) => !!v.trim())
    .map((parameter) => {
      const substrings = parameter
        .split(/\s+/)
        .filter((substring) => substring);
      if (substrings.length < 2) {
        throw new Error(`Invalid parameter: ${parameter}`);
      }

      const type = substrings[0];
      const name = substrings.at(-1);
      const keywords = substrings.slice(1, -1);

      if (!name) {
        throw new Error(`Invalid parameter: ${parameter}`);
      }

      return {
        type,
        name,
        ...(keywords.includes('indexed') && { indexed: true }),
      };
    });
  return {
    signature:
      '0x' +
      keccak256(
        `${name}(${parameterList.map((parameter) => parameter.type).join(',')})`,
      ).toString('hex'),
    decode: (web3, data, topics) =>
      web3.eth.abi.decodeLog(
        parameterList,
        web3.utils.bytesToHex(data),
        topics.map((topic) => web3.utils.bytesToHex(topic)).slice(1),
      ) as T,
  };
};
