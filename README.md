# Universal ÐApp

Demo: [http://d11e9.github.com/universal-dapp](http://d11e9.github.com/universal-dapp)

A Universal Interface for contracts on the Ethereum blockchain. Best used in conjunction with a contract compiler like [browser-solidity](https://d11e9.github.io/browser-solidity) or in cases where you already have an ABI and/or bytecode for an existing contract

##How to use

Include the source and its dependencies in your html.

    <script src="lib/ethereumjs-vm.js"></script>
    <script src="lib/web3.min.js"></script>
    <script src="src/universal-dapp.js"></script>

For the Universal-Universal Dapp which has input for ABI and Bytecode you can do the following:
    
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


Or if you just need an interface for an existing contract you can provide its address directly. In the example below we omit the `bytecode` property wich prevents the uDApp from creating new contracts.

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

In its initial form this project was a direct copy/paste of parts of [chriseth](https://github.com/chriseth)'s browser based [Solidty compiler](https://github.com/chriseth/browser-solidity).

##Caveats

Currently **UniversalÐApp** works ~~exclusively~~ inside of a JavaScript Ethereum VM ([ethereumjs-vm](https://github.com/ethereum/ethereumjs-vm)) by [wanderer](https://github.com/wanderer).

There is alpha support for [web3.js](https://github.com/ethereum/web3.js) connections to a local Ethereum Node, to deploy and interact with contracts live on the Ethereum Blockchain.
