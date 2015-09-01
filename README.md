# Universal ÐApp

Demo: [http://d11e9.github.com/universal-dapp](http://d11e9.github.com/universal-dapp)

Is a Universal Interface for contracts on the Ethereum blockchain. Best used in conjunction with a contract compiler like [browser-solidity](https://github.com/chriseth/browser-solidity) or in cases where you already have an ABI and/or bytecode for an existing contract

##How to use

Include the source and its dependencies in your html.

    <script src="lib/ethereumjs-vm.js"></script>
    <script src="lib/web3.min.js"></script>
    <script src="src/universal-dapp.js"></script>

For the truly Universal Dapp which has input for ABI and Bytecode you can do the following:
    
    <script>
        $(function(){
            var dApp = new UniversalDApp([]);
            $('body').append( dApp.render() )
        });
    </script>


If you'd like to use a universal DApp for a specific set of contracts, either already in the blockchain or in the form of compiled bytecode and ABI, you can do the following: 


    <script>
        $(function(){
            var dApp = new UniversalDApp([{
                name: "{{name}}",
                interface: "{{json abi interface}}",
                bytecode: "{{compiled bytecode}}"
            }]);
            $('body').append( dApp.render() )
        });
    </script>


Or if you just need an interafce for an existing contract you can provide its address directly

    <script>
        $(function(){
            var dApp = new UniversalDApp([{
                name: "{{name}}",
                interface: "{{json abi interface}}",
                address: {{address hex}}
            }]);
            $('body').append( dApp.render() )
        });
    </script>



###Example

Check out the `gh-pages` branch [index.html](http://d11e9.github.com/universal-dapp) for a full working example.

##Acknowledgements

In its current form **UniversalÐApp** is a direct copy/paste of parts of [chriseth](https://github.com/chriseth)'s browser based [Solidty compiler](https://github.com/chriseth/browser-solidity).

##Caveats

Currently **UniversalÐApp** works exclusively inside of a JavaScript Ethereum VM ([ethereumjs-vm](https://github.com/ethereum/ethereumjs-vm)) by [wanderer](https://github.com/wanderer).

Going forward we plan to add proper [web3.js](https://github.com/ethereum/web3.js) support to deploy and interact with contracts live on the Ethereum Blockchain.
