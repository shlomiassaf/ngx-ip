export const noop = () => {};

export const v4 = {
  BLOCK_COUNT: 4,
  SEP: '.',
  RE_CHAR: /^[0-9]$/,
  RE_BLOCK: /^([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])$/,
  blocks(): string[] { return ['', '' ,'', ''] },
  fromBlocks(blocks: string[]): string {
    return blocks.join(v4.SEP);
  },
  split(value: string): string[] {
    if (!value) return v4.blocks();
    const result = value.split(v4.SEP);
    if( result.length !== v4.BLOCK_COUNT ) {
      throw new Error('Invalid IPV4');
    }
    return result;
  },
  isValid(blocks: string[]): boolean {
    return blocks.every(value => parseInt(value) >= 0 && parseInt(value) <=255);
  }
};

export const v6 = {
  BLOCK_COUNT: 8,
  SEP: ':',
  RE_CHAR: /^[0-9A-Fa-f]$/,
  RE_BLOCK: /^[0-9A-Fa-f]{0,4}$/,
  blocks(): string[] { return v4.blocks().concat(v4.blocks()) },
  fromBlocks(blocks: string[]): string {
    return blocks.map(value => value ? value : '0000').join(v6.SEP);
  },
  split(value: string): string[] {
    if (!value) return v6.blocks();
    const consecutiveSplit = value.split(v6.SEP + v6.SEP);
    const result: string[] = consecutiveSplit[0].split(v6.SEP);

    if (consecutiveSplit.length === 2) {
      // if :: is used we need to calculate the amount of empty blocks.
      // - Get the right parts (left is already the result)
      // - find how much blocks are missing to reach total of 8.
      // - fill the empty blocks and append right part.
      let rightPart = consecutiveSplit[1].split(v6.SEP);

      let emptySpaces = v6.BLOCK_COUNT - (result.length + rightPart.length);

      result.splice(result.length, 0, ...v6.blocks().slice(0, emptySpaces));
      result.splice(result.length, 0, ...rightPart);
    }

    //consecutive :: allowed once.
    if( consecutiveSplit.length > 2 || result.length !== v6.BLOCK_COUNT ) {
      throw new Error('Invalid IPV6');
    }

    return result;
  },
  isValid(blocks: string[]): boolean {
    return blocks.every(value => v6.RE_BLOCK.test(value)) && blocks.some(value => !!value)
  }
};

export const inputSelection = {
  /**
   * Given an input element, insert the supplied value at the caret position.
   * If some (or all) of the text is selected, replaces the selection with the value.
   * In case the input is falsy returns the value. (universal)
   * @param input
   * @param value
   * @returns {string}
   */
  insert(input: HTMLInputElement, value: string): string {
    return input
      ? input.value.substr(0, input.selectionStart) + value + input.value.substr(input.selectionEnd)
      : value
    ;
  },
  /**
   * Returns true if some (or all) of the text is selected
   * @param input
   * @returns {boolean}
   */
  some(input: HTMLInputElement): boolean {
    return input.selectionStart > input.selectionEnd;
  },
  /**
   * Returns true if the whole text is selected
   * @param input
   * @returns {boolean}
   */
  all(input: HTMLInputElement): boolean {
    return input.selectionStart === 0 && input.selectionEnd === input.value.length;
  }
};
