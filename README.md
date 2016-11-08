#ng2-ip
###an angular 2 IPv4 and IPv6 input component

`ng2-ip` is an IPv4/6 input component that implements block level IP inputs, each block has it's own input element for better UX control.

This allows highlighting specific blocks with invalid syntax, disabling specific blocks (limit pools, etc...) and more.
    
`ng2-ip` is **NOT** a mask component, masking is a different approach which uses one input element for the whole IP address.


## Features
* Supports IPv4 and IPv6
* Control if user can type invalid characters
* Separator behaves like TAB (e.g: in IPv4 pressing dot (.) is like pressing TAB)
* Support paste (single value or whole address)
* Support copy block or address
* Disable specific blocks
* Highlight invalid blocks (does not replace validation)
* Themes
* Implements OnPush
* Supports AOT


 ##Validation
`ng2-ip` performs internal validation at the block level to allow invalid block highlighting.

Block validation **does not** replace form validation, if you use angular forms you still need to validate the output, as you need with any other control.

##Should I use ng2-ip or mask?
Well, this depends on your requirements, here are some key points:
####Copy / Paste
`ng2-ip` offers better UX but since it has multiple input elements it has a different copy/paste (CMD/CTRL-C/V) behaviour.

When pasting, `ng2-ip` will auto detect the content and handle full address automatically.

When copying, `ng2-ip` has 3 copy modes to choose from, these modes fire only if the **whole text** in a block is selected otherwise copy behavior is native.

* **Block mode**: This is similar to the native copy mode, when fired it will copy the content of the block.
* **Address mode**: This will copy the whole address.
* **Select mode**: Once fired the user will be prompted to select Block or Address copy.  
    This mode is not supported in browsers that does not support the `document.execCommand('copy');` method (Safari 9), if set in such browser it will fallback to Block mode.
  
####Rendering
`ng2-ip` renders more input elements.  
This should have no effect on performance, unless you render 1000+ components and if you do you're doing something wrong :)

If these are deal breakers for you you should definitely use a mask component, here are some examples <a href="https://github.com/text-mask/text-mask/tree/master/angular2" target="_blank">Text Mask</a>, <a href="http://www.primefaces.org/primeng/#/inputmask" target="_blank">PrimeNG Input Mask</a>, etc...