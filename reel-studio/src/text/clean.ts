import {createContext} from 'react';

/** true = render the picture only (no hooks, labels, numbers, tags, credits). Used for cover images. */
export const CleanFrame = createContext(false);
