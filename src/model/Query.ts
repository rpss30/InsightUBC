
export interface OPTIONS {
	COLUMNS: string[];
	ORDER?: SORT | ANYKEY;
}

export interface AND {
	AND: Array<AND | OR | LT | GT | EQ | NOT | IS>;
}

export interface OR {
	OR: Array<AND | OR | LT | GT | EQ | NOT | IS>;
}

export interface NOT {
	NOT: AND | OR | LT | GT | EQ | NOT | IS;
}

export interface IS {
	[key: string]: string;
}

export interface GT {
	[key: string]: number;
}

export interface LT {
	[key: string]: number;
}

export interface EQ {
	[key: string]: number;
}

export interface ORDER {
	dir: string;
	keys: string[];
}

export interface Query {
	WHERE: AND | OR | LT | GT | EQ | NOT | IS | {[key: string]: string | number};
	OPTIONS: OPTIONS;
	TRANSFORMATIONS?: TRANSFORMATIONS;
}

// Sorting
export interface SORTList {
	dir: string;
	keys: [Key | ApplyKey]
}

type ANYKEY = ApplyKey | Key;

export type SORT = SORTList | ANYKEY

// Transformations
export interface TRANSFORMATIONS {
	GROUP: Key[];
	APPLY: APPLYRULE[];
}

export interface APPLYRULE {
	[key: string]: {APPLYTOKEN: Key};
}

type MKey = string;
type SKey = string;
export type Key = MKey | SKey;
type APPLYTOKEN = string;
type ApplyKey = string;

// Query types
export type FILTER = AND | OR | LT | GT | EQ | NOT | IS | {[key: string]: string | number};
export type MCOMPARATOR = LT | EQ | GT;
