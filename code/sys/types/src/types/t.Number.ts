/* A number representing an 0-based index. */
export type Index = number;

/* A number representing a network port */
export type PortNumber = number;

/* A number representing screen pixels. */
export type Pixels = number;

/* Number representing a percentage: 0..1 ← (0=0%, 1=100%) */
export type Percent = number;

/* A pixel OR a percentage number: 0..1 = percent, >1 = pixels */
export type PixelOrPercent = Pixels | Percent; //
