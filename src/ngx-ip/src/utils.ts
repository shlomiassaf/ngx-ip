export const noop = () => {};

export interface AddressModeLogic {
  BLOCK_COUNT: number;
  SEP: string;
  RE_CHAR: RegExp;
  RE_BLOCK: RegExp[];
  blocks: () => string[];
  fromBlocks: (blocks: string[], sep?: string) => string;
  split: (value: string, sep?: string, throwError?: boolean) => string[];
  isValid: (blocks: string[]) => boolean;
  isMaxLen: (value: string) => boolean;
}

const V4_BLOCK_RE = /^([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])$/;

export const v4: AddressModeLogic = {
  BLOCK_COUNT: 4,
  SEP: '.',
  RE_CHAR: /^[0-9]$/,
  RE_BLOCK: [V4_BLOCK_RE, V4_BLOCK_RE, V4_BLOCK_RE, V4_BLOCK_RE],
  blocks(): string[] { return ['', '' , '', '']; },
  fromBlocks(blocks: string[], sep: string = v4.SEP): string {
    return blocks.join(sep);
  },
  split(value: string, sep: string = v4.SEP, throwError: boolean = false): string[] {
    if (!value) {
      return v4.blocks();
    }
    const result = value.split(sep);
    if (throwError && result.length !== v4.BLOCK_COUNT ) {
      throw new Error('Invalid IPV4');
    }
    return result;
  },
  isValid(blocks: string[]): boolean {
    return blocks.every(value => parseInt(value, 10) >= 0 && parseInt(value, 10) <= 255);
  },
  isMaxLen(value: string): boolean {
    if (value.length === 3) {
      return true;
    } else if (value.length === 2 && parseInt(value, 10) > 25) {
      return true;
    } else {
      return false;
    }
  }
};

export const v4WithMask: AddressModeLogic = Object.assign(Object.create(v4), {
  BLOCK_COUNT: 5,
  RE_BLOCK: v4.RE_BLOCK.concat([/^([0-2]?[0-9]|30)$/]),
  blocks(): string[] { return ['', '' , '', '', '']; },
  fromBlocks(blocks: string[], sep: string = v4.SEP): string {
    return blocks.slice(0, 4).join(sep) + `/${blocks[4]}`;
  },
  split(value: string, sep: string = v4.SEP, throwError: boolean = false): string[] {
    if (!value) {
      return v4WithMask.blocks();
    }
    const result = value.split(sep);
    result.push(...result.pop().split('/'));
    if (throwError && result.length !== v4WithMask.BLOCK_COUNT ) {
      throw new Error('Invalid IPV4 with Mask');
    }
    return result;
  },
  isValid(blocks: string[]): boolean {
    for (let i = 0; i < 4; i++) {
      const value = parseInt(blocks[i], 10);
      if ( !(value >= 0 && value <= 255) ) {
        return false;
      }
    }
    const value = parseInt(blocks[4], 10);
    return value >= 4 && value <= 30;
  },
  isMaxLen(value: string): boolean {
    if (value.length === 3) {
      return true;
    } else if (value.length === 2 && parseInt(value, 10) > 25) {
      return true;
    } else {
      return false;
    }
  }
});

const V6_BLOCK_RE = /^[0-9A-Fa-f]{0,4}$/;

export const v6: AddressModeLogic = {
  BLOCK_COUNT: 8,
  SEP: ':',
  RE_CHAR: /^[0-9A-Fa-f]$/,
  RE_BLOCK: v4.RE_BLOCK.map( s => V6_BLOCK_RE).concat(v4.RE_BLOCK.map( s => V6_BLOCK_RE)),
  blocks(): string[] { return v4.blocks().concat(v4.blocks()); },
  fromBlocks(blocks: string[], sep: string  = v6.SEP): string {
    return blocks.map(value => value ? value : '0000').join(sep);
  },
  split(value: string, sep: string = v6.SEP, throwError: boolean = false): string[] {
    if (!value) {
      return v6.blocks();
    }
    const consecutiveSplit = value.split(sep + sep);
    const result: string[] = consecutiveSplit[0].split(sep);

    if (consecutiveSplit.length === 2) {
      // if :: is used we need to calculate the amount of empty blocks.
      // - Get the right parts (left is already the result)
      // - find how much blocks are missing to reach total of 8.
      // - fill the empty blocks and append right part.
      let rightPart = consecutiveSplit[1].split(sep);

      let emptySpaces = v6.BLOCK_COUNT - (result.length + rightPart.length);

      result.splice(result.length, 0, ...v6.blocks().slice(0, emptySpaces));
      result.splice(result.length, 0, ...rightPart);
    }

    // consecutive :: allowed once.
    if (throwError && (consecutiveSplit.length > 2 || result.length !== v6.BLOCK_COUNT) ) {
      throw new Error('Invalid IPV6');
    }

    return result;
  },
  isValid(blocks: string[]): boolean {
    return blocks.every(value => V6_BLOCK_RE.test(value)) && blocks.some(value => !!value)
  },
  isMaxLen(value: string): boolean {
    return value.length === 4;
  }
};

const MAC_BLOCK_RE = /^[0-9A-Fa-f]{1,2}$/;

export const mac: AddressModeLogic = Object.assign(Object.create(v6), {
  BLOCK_MAX_LEN: 2,
  BLOCK_COUNT: 6,
  RE_BLOCK: v4.RE_BLOCK.map( s => MAC_BLOCK_RE).concat([MAC_BLOCK_RE, MAC_BLOCK_RE]),
  blocks(): string[] { return ['', '' , '', '', '', '']; },
  fromBlocks(blocks: string[], sep: string =  mac.SEP): string {
    return blocks.join(sep);
  },
  split(value: string, sep: string = mac.SEP, throwError: boolean = false): string[] {
    if (!value) {
      return mac.blocks();
    }
    const result = value.split(sep);
    if ( throwError && result.length !== mac.BLOCK_COUNT ) {
      throw new Error('Invalid MAC address');
    }
    return result;
  },
  isValid(blocks: string[]): boolean {
    return blocks.every(value => MAC_BLOCK_RE.test(value)) && blocks.some(value => !!value);
  },
  isMaxLen(value: string): boolean {
    return value.length === 2;
  }
});

export const inputSelection = {
  /**
   * Given an input element, insert the supplied value at the caret position.
   * If some (or all) of the text is selected, replaces the selection with the value.
   * In case the input is falsy returns the value. (universal)
   * @param input
   * @param value
   */
  insert(input: HTMLInputElement, value: string): string {
    return input
      ? input.value.substr(0, input.selectionStart) + value + input.value.substr(input.selectionEnd)
      : value
    ;
  },
  caretIsLast(input: HTMLInputElement): boolean {
    return input
      ? input.selectionStart === input.selectionEnd && input.selectionStart === input.value.length
      : false
    ;
  },
  /**
   * Returns true if some (or all) of the text is selected
   * @param input
   */
  some(input: HTMLInputElement): boolean {
    return input.selectionStart > input.selectionEnd;
  },
  /**
   * Returns true if the whole text is selected
   * @param input
   */
  all(input: HTMLInputElement): boolean {
    return input.selectionStart === 0 && input.selectionEnd === input.value.length;
  }
};

// https://github.com/angular/material2/blob/master/src/cdk/coercion/boolean-property.ts
export function coerceBooleanProperty(value: any): boolean {
  return value != null && `${value}` !== 'false';
}
