function UniversalDApp (contracts, options) {
    this.options = options || {};
    this.$el = $('<div class="udapp" />');
    this.contracts = contracts;
    this.stateTrie = new EthVm.Trie();
    this.vm = new EthVm.VM(this.stateTrie);
    //@todo this does not calculate the gas costs correctly but gets the job done.
    this.identityCode = 'return { gasUsed: 1, return: opts.data, exception: 1 };';
    this.identityAddr = ethUtil.pad(new Buffer('04', 'hex'), 20)
    this.vm.loadPrecompiled(this.identityAddr, this.identityCode);
    this.secretKey = '3cd7232cd6f3fc66a57a6bedc1a8ed6c228fff0a327e169c2bcc5e869ed49511'
    this.publicKey = '0406cc661590d48ee972944b35ad13ff03c7876eae3fd191e8a2f77311b0a3c6613407b5005e63d7d8d76b89d5f900cde691497688bb281e07a5052ff61edebdc0'
    this.address = ethUtil.pubToAddress(new Buffer(this.publicKey, 'hex'));
    this.account = new EthVm.Account();
    this.account.balance = 'f00000000000000001';
    this.nonce = 0;
    this.stateTrie.put(this.address, this.account.serialize());

}
UniversalDApp.prototype.render = function () {
    if (this.contracts.length == 0) {
        this.$el.append( this.getABIInputForm() );
    } else {

        for (var c in this.contracts) {
            var $contractEl = $('<div class="contract"/>');

            $contractEl.append( $title );
            if (this.contracts[c].address) {
                this.getInstanceInterface(this.contracts[c], this.contracts[c].address, $contractEl );
            } else {
                var $title = $('<span class="title"/>').text( this.contracts[c].name );
                $contractEl.append( $title, this.getCreateInterface( $contractEl, this.contracts[c]) );
            }
            this.$el.append( $contractEl );
        }
    }
    return this.$el;
}

UniversalDApp.prototype.getABIInputForm = function (cb){
    var self = this;
    var $el = $('<div class="udapp-setup" />');
    var $nameInput = $('<input type="text" class="name" placeholder="ContractName"/>')
    var $abiInput = $('<input type="text" class="abi" placeholder="[json ABI interface]"/>')
    var $binaryInput = $('<input type="text" class="code" placeholder="BYTECODE"/>')
    var $createButton = $('<button />').text('Create DApp')
    $createButton.click(function(ev){
        var contracts =  [{name: $nameInput.val(), interface: $abiInput.val(), bytecode: $binaryInput.val() }];
        if (cb) {
            var err = null;
            var dapp = null;
            try {
                dapp = new UniversalDApp( contracts, self.options );
            } catch(e) {
                err = e;
            }
            cb( err, dapp )
        } else {
            self.contracts = contracts;
            self.$el.empty().append( self.render() )
        }
    })
    $el.append( $nameInput ).append( $abiInput ).append( $binaryInput ).append( $createButton )
    return $el;
}


UniversalDApp.prototype.getCreateInterface = function ($container, contract) {
    var self = this;
    var $createInterface = $('<div class="create"/>');
    if (this.options.removable) {
        var $close = $('<div class="udapp-close" />')
        $close.click( function(){ self.$el.remove(); } )
        $createInterface.append( $close );
    }
    var $newButton = this.getInstanceInterface( contract )
    var $atButton = $('<button class="at"/>').text('At Address').click( function(){ self.clickContractAt( self, $container, contract ) } );
    $createInterface.append( $atButton ).append( $newButton );
    return $createInterface;
}

UniversalDApp.prototype.getInstanceInterface = function (contract, address, $target) {
    var self = this;
    var abi = JSON.parse(contract.interface);
    var funABI = this.getConstructorInterface(abi);
    var $createInterface = $('<div class="createContract"/>');

    var appendFunctions = function (address, $el){
        
        var $instance = $('<div class="instance"/>');
        if (self.options.removable_instances) {
            var $close = $('<div class="udapp-instance-close" />')
            $close.click( function(){ $instance.remove(); } )
            $instance.append( $close );
        }
        var $title = $('<span class="title"/>').text( contract.name + " at " + address.toString('hex') );
        $instance.append( $title );
        $.each(abi, function(i, funABI) {
            if (funABI.type != 'function') return;
            $instance.append(self.getCallButton({
                abi: funABI,
                address: address
            }));
        });
        ($el || $createInterface ).append( $instance )
    }

    

    if (!address || !$target) {
        $createInterface.append( this.getCallButton({
            abi: funABI,
            bytecode: contract.bytecode,
            appendFunctions: appendFunctions
        }));
    } else {
        appendFunctions( address, $target );
    }
    
    return $createInterface;
}

UniversalDApp.prototype.getConstructorInterface = function(abi) {
    var funABI = {'name':'','inputs':[],'type':'constructor','outputs':[]};
    for (var i = 0; i < abi.length; i++)
        if (abi[i].type == 'constructor') {
            funABI.inputs = abi[i].inputs || [];
            break;
        }
    return funABI;
}

UniversalDApp.prototype.getCallButton = function(args) {
    var self = this;
    // args.abi, args.bytecode [constr only], args.address [fun only]
    // args.appendFunctions [constr only]
    var isConstructor = args.bytecode !== undefined;
    var fun = new web3.eth.function(args.abi);
    var inputs = '';
    $.each(args.abi.inputs, function(i, inp) {
        if (inputs != '') inputs += ', ';
        inputs += inp.type + ' ' + inp.name;
    });
    var inputField = $('<input/>').attr('placeholder', inputs);
    var outputSpan = $('<div class="output"/>');
    var button = $('<button/>')
        .text(args.bytecode ? 'Create' : fun.displayName())
        .click(function() {
            var funArgs = $.parseJSON('[' + inputField.val() + ']');
            var data = fun.toPayload(funArgs).data;
            console.log( funArgs )
            if (data.slice(0, 2) == '0x') data = data.slice(2);
            if (isConstructor)
                data = args.bytecode + data.slice(8);
            outputSpan.text('...');
            self.runTx(data, args.address, function(err, result) {
                if (err)
                    outputSpan.text(err).addClass('error');
                else if (isConstructor) {
                    outputSpan.text(' Creation used ' + result.vm.gasUsed.toString(10) + ' gas.');
                    args.appendFunctions(result.createdAddress);
                } else {
                    var outputObj = fun.unpackOutput('0x' + result.vm.return.toString('hex'));
                    outputSpan.text(' Returned: ' + JSON.stringify(outputObj));
                }
            });
        });
    if (!isConstructor)
        button.addClass('runButton');
    var c = $('<div class="contractProperty"/>')
        .append(button);
    if (args.abi.inputs.length > 0)
        c.append(inputField);
    return c.append(outputSpan);
}

UniversalDApp.prototype.clickNewContract = function ( self, $contract, contract ) {
    $contract.append( self.getInstanceInterface(contract) );
}

UniversalDApp.prototype.clickContractAt = function ( self, $contract, contract ) {
    var address = prompt( "What Address is this contract at in the Blockchain? ie: '0xdeadbeaf...'" )   
    self.getInstanceInterface(contract, address, $contract );
}

UniversalDApp.prototype.runTx = function( data, to, cb) {
    console.log( "runtx data: ", data )
    console.log( "runtx to:", to )
    try {
        var tx = new EthVm.Transaction({
            nonce: new Buffer([this.nonce++]), //@todo count beyond 255
            gasPrice: '01',
            gasLimit: '3000000',
            to: to,
            data: data
        });
        tx.sign(new Buffer(this.secretKey, 'hex'));
        this.vm.runTx({tx: tx}, cb);
    } catch (e) {
        cb( e, null );
    }
}