function UniversalDApp (contracts, options) {
    this.options = options || {};
    this.$el = $('<div class="udapp" />');
    this.contracts = contracts;

    if (web3.currentProvider) {

    } else if (options.vm) {
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
    } else {
        var host = options.host || "localhost";
        var host = options.port || "8545";
        var rpc_url = 'http://' + host + ':' + port;
        web3.setProvider( new web3.providers.HttpProvider( rpc_url ) );
    }

}
UniversalDApp.prototype.render = function () {
    if (this.contracts.length == 0) {
        this.$el.append( this.getABIInputForm() );
    } else {

        for (var c in this.contracts) {
            var $contractEl = $('<div class="contract"/>');

            if (this.contracts[c].address) {
                this.getInstanceInterface(this.contracts[c], this.contracts[c].address, $contractEl );
            } else {
                var $title = $('<span class="title"/>').text( this.contracts[c].name );
                $contractEl.append( $title ).append( this.getCreateInterface( $contractEl, this.contracts[c]) );
            }
            this.$el.append( $contractEl );
        }
    }
    $legend = $('<div class="legend" />')
        .append( $('<div class="attach"/>').text('Attach') )
        .append( $('<div class="transact"/>').text('Transact') )
        .append( $('<div class="call"/>').text('Call') )

    this.$el.append( $('<div class="poweredBy" />')
        .html("<a href='http://github.com/d11e9/universal-dapp'>Universal ÐApp</a> powered by The Blockchain") )

    this.$el.append( $legend )
    return this.$el;
}

UniversalDApp.prototype.getABIInputForm = function (cb){
    var self = this;
    var $el = $('<div class="udapp-setup" />');
    var $jsonInput = $('<textarea class="json" placeholder=\'[ { "name": name, "bytecode": bytyecode, "interface": abi }, { ... } ]\'/>')
    var $createButton = $('<button class="udapp-create"/>').text('Create a Universal ÐApp')
    $createButton.click(function(ev){
        var contracts =  $.parseJSON( $jsonInput.val() );
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
    $el.append( $jsonInput ).append( $createButton )
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
    var $atButton = $('<button class="atAddress"/>').text('At Address').click( function(){ self.clickContractAt( self, $container, contract ) } );
    $createInterface.append( $atButton ).append( $newButton );
    return $createInterface;
}

UniversalDApp.prototype.getInstanceInterface = function (contract, address, $target) {
    var self = this;
    var abi = JSON.parse(contract.interface).sort(function(a,b){
        if (a.name > b.name) return -1;
        else return 1;
    }).sort(function(a,b){
        if (a.constant == true) return -1;
        else return 1;
    });
    var funABI = this.getConstructorInterface(abi);
    var $createInterface = $('<div class="createContract"/>');

    var appendFunctions = function (address, $el){
        
        var $instance = $('<div class="instance"/>');
        if (self.options.removable_instances) {
            var $close = $('<div class="udapp-close" />')
            $close.click( function(){ $instance.remove(); } )
            $instance.append( $close );
        }
        var $title = $('<span class="title"/>').text( contract.name + " at 0x" + address.toString('hex') );
        $title.click(function(){
            $instance.toggleClass('hide');
        })
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
    if (!args.bytecode && !fun.displayName()) return;
    var inputField = $('<input/>').attr('placeholder', inputs);
    var outputSpan = $('<div class="output"/>');

    function getReturnOutput(result) {
        return $('<div class="returned">').text(' Returned: ' + JSON.stringify( result ) )
    }

    function getGasUsedOutput(result) {
        return $('<div class="gasUsed">').text(' Cost: ' + result.gasUsed.toString(10) + ' gas.' )
    }

    function getOutput() {
        var values = Array.prototype.slice.call(arguments);
        var $result = $('<div class="result" />');
        var $close = $('<div class="udapp-close" />')
            $close.click( function(){ $result.remove(); } )
            $result.append( $close );
        for( var v in values ) { $result.append( values[v] ); } 
        return $result;
    }

    var button = $('<button />')
        .addClass( 'call' )
        .text(args.bytecode ? 'Create' : fun.displayName())
        .click(function() {
            var funArgs = $.parseJSON('[' + inputField.val() + ']');
            var data = fun.toPayload(funArgs).data;
            if (data.slice(0, 2) == '0x') data = data.slice(2);
            if (isConstructor)
                data = args.bytecode + data.slice(8);
            $result = getOutput( $('<a href="#" title="Waiting for transaction to be mined.">Polling for tx receipt...</a>') );

            outputSpan.append( $result );
            self.runTx(data, args, function(err, result) {
                if (err) {
                    $result.replaceWith( getOutput( $('<span/>').text(err).addClass('error') ) );
                } else if (self.options.vm && isConstructor) {
                    $result.replaceWith( getOutput( getGasUsedOutput( result ) ) );
                    args.appendFunctions(result.createdAddress);
                } else if (self.options.vm){
                    var outputObj = fun.unpackOutput('0x' + result.vm.return.toString('hex'));
                    $result.replaceWith( getOutput( getReturnOutput( outputObj ), getGasUsedOutput( result.vm ) ) );
                } else if (args.abi.constant && !isConstructor) {
                    $result.replaceWith( getOutput( getReturnOutput( result ) ) );
                } else {
                    
                    function tryTillResponse (txhash, done) {
                        web3.eth.getTransactionReceipt(result, testResult );

                        function testResult (err, address) {
                            if (!err && !address) {
                                console.log( "Polling for tx receipt....")
                                setTimeout( function(){ tryTillResponse(txhash, done) }, 500)
                            } else done( err, address )
                        }

                    }
                    tryTillResponse( result, function(err, result) {
                        if (isConstructor) {
                            $result.html('');
                            args.appendFunctions(result.contractAddress);
                        } else $result.replaceWith( getOutput( getReturnOutput( result ), getGasUsedOutput( result ) ) );
                    })
                
                }
            });
        });

    var $contractProperty = $('<div class="contractProperty"/>');
    $contractProperty
        .toggleClass( 'constant', !isConstructor && args.abi.constant )
        .toggleClass( 'hasArgs', args.abi.inputs.length > 0)
        .toggleClass( 'constructor', isConstructor)
        .append(button).append(inputField);
    return $contractProperty.append(outputSpan);
}

UniversalDApp.prototype.clickNewContract = function ( self, $contract, contract ) {
    $contract.append( self.getInstanceInterface(contract) );
}

UniversalDApp.prototype.clickContractAt = function ( self, $contract, contract ) {
    var address = prompt( "What Address is this contract at in the Blockchain? ie: '0xdeadbeaf...'" )   
    self.getInstanceInterface(contract, address, $contract );
}

UniversalDApp.prototype.runTx = function( data, args, cb) {
    var to = args.address;
    var constant = args.abi.constant;
    
    if (!this.vm) {
        if (constant) {
            web3.eth.call({
                from: web3.eth.accounts[0],
                to: to,
                data: data,
                gas: 1000000
            }, function(err, resp) {
                cb( err, resp )
            })
        } else {
            web3.eth.sendTransaction({
                from: web3.eth.accounts[0],
                to: to,
                data: data,
                gas: 1000000
            }, function(err, resp) {
                console.log( 'sendTx callback:', err, resp )
                cb( err, resp )
            })
        }
    } else {
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
}
