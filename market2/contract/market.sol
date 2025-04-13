// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

contract myContract{
    struct Item{
        uint id;
        string name;
        uint price;
        address payable seller;
        address owner;
        bool isSold;
    }

    uint public ItemCount=0;
    mapping (uint =>Item)public items;
    mapping (address=>uint[]) public ownedItems;

    function listItems(string memory _name, uint _price) public {
        require(_price>0,"Price should be greater than 0");
        ItemCount++;
        items[ItemCount]=Item(ItemCount,_name,_price,payable(msg.sender),msg.sender,false);
        ownedItems[msg.sender].push(ItemCount);
        
    }

    function buy(uint _id) public  payable {
        Item storage item=items[_id];
        require(_id>0,"invalid id");
        require(msg.value==item.price,"incorrect price");
        require(!item.isSold,"item is already sold");
        require(msg.sender!=item.seller,"you cannot buy your own items");

        item.isSold=true;
        
       payable(items[_id].seller).transfer(msg.value);

       transferOwner(_id, item.seller, msg.sender);
    }

    function transferOwner(uint _id,address _from,address _to) internal  {
        Item storage item=items[_id];
        item.owner=_to;

        uint[] storage fromItems=ownedItems[_from];
        for(uint i = 0 ;i<fromItems.length;i++){
            if(fromItems[i]==_id){
                fromItems[i]=fromItems[fromItems.length-1];
                fromItems.pop();
                break ;
            }
        }

        ownedItems[_to].push(_id);


    }


    function transferWithoutMoney(uint _id,address _to) public {
        Item storage item=items[_id];
        require(_id>0 && _id<=ItemCount,"items doesnot exist");
        require(!item.isSold ,"items is already sold");
        require(msg.sender== item.owner, "you are not the owner of this items") ;
       transferOwner(_id ,msg.sender,_to);

    }
    function getItemsByOwner(address _owner) public  view returns (uint[] memory){
        return ownedItems[_owner];
    }
}
//0xf5fb750c7e61e6e6efa3499b4f0ce9cf2f2b1e2d contract address