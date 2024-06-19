import { RefObject } from 'react';

import { shakeFalsyItem } from '../arrayMethods';
import { isObject } from '../judges/judgeType';

// type ArrayElement<ArrayType extends readonly unknown[]> =
//   ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

// type Unpacked<T> = T extends (infer U)[] ? U : T;

// type Primitive = boolean | number | string | bigint;

type AnyFn = (...args: any[]) => any;
// type AnyObj = { [key: string]: any };
// type AnyArr = any[];

// type MayFunction<T, Params extends any[] = []> = T | ((...params: Params) => T);
// type MayPromise<T> = T | Promise<T>;
type MayArray<T> = T | T[];
// type DeMayArray<T extends MayArray<any>> = T extends any[] ? T[number] : T;

// type NotFunctionValue = Exclude<any, AnyFn>;

// type ExtendProps<Main, Old> = Omit<Old, keyof Main> & Main;

type Element = HTMLElement | undefined | null;

type MayRef<T> = T | RefObject<T>;

type ElementSingle = MayRef<Element>;
export type ElementRefs = MayRef<MayArray<MayRef<Element>>>;
export function getElementsFromRef(refs: ElementRefs): HTMLElement[] {
  const getRef = <T>(ref: T | RefObject<T>): T =>
    (isObject(ref) && 'current' in ref ? ref.current : ref) as T;
  return shakeFalsyItem(flap(getRef(refs)).map((ref) => getRef(ref)));
}

function flap<T>(arr: T): T extends Array<infer U> ? U[] : T[] {
  // @ts-expect-error force type
  return Array.isArray(arr) ? arr : [arr];
}

function getSingleElement(ref: ElementSingle): HTMLElement | undefined {
  const el = isObject(ref) && 'current' in ref ? ref.current : ref;
  return el ?? undefined;
}
