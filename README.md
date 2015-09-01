# Universal ÐApp


Is a Universal Interface for contracts on the Ethereum blockchain. Best used in conjunction with https://github.com/d11e9/browser-solidity or in cases where you have a ABI for an existing contract

##Examples

For the truly Universal Dapp which has input for ABI and Bytecode you can do the following:

	<script>
        $(function(){
            var dApp = new UniversalDapp([]);
            $('body').append( dApp.render() )
        });
    </script>


If you'd like to use a universal DApp for a specific set of contracts, either already in the blockchain or in the form of compiled bytecode and ABI, you can do the following: 


	<script>
        $(function(){
            var dApp = new UniversalDapp([{
				name: "{{name}}",
				interface: "{{json abi interface}}",
				bytecode: "{{compiled bytecode}}"
            }]);
            $('body').append( dApp.render() )
        });
    </script>
