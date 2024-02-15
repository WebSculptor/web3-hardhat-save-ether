// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract SaveEth {
    // capture every address and the amount they saved
    mapping(address => uint256) savings;

    event SavingsSuccessfulEvent(
        address indexed staker,
        uint256 indexed amount
    );

    function deposit() external payable {
        /*
            Sanity check
            Ensure that the msg.sender is not address 0
        */
        require(
            msg.sender != address(0),
            "Wrong EOA (Externally Owned Account)"
        );
        require(msg.value > 0, "cannot save 0 value");

        savings[msg.sender] += msg.value;

        emit SavingsSuccessfulEvent(msg.sender, msg.value);
    }

    function withdraw() external {
        /*
            Sanity check
            Ensure that the msg.sender is not address 0

            Re-entrancing
        */
        require(
            msg.sender != address(0),
            "Wrong EOA (Externally Owned Account)"
        );

        uint256 _userSavings = savings[msg.sender];

        require(_userSavings > 0, "You don't have any savings");

        savings[msg.sender] -= _userSavings;

        payable(msg.sender).transfer(_userSavings);
    }

    function checkSavings(
        address _userAddress
    ) external view returns (uint256) {
        return savings[_userAddress];
    }

    function sendOutSavings(address _receiver, uint256 _amount) external {
        require(msg.sender != address(0), "No zero address call");
        require(_amount > 0, "Can not send 0 value");

        require(
            savings[msg.sender] >= _amount,
            "You do not have enough value to transfer"
        );

        savings[msg.sender] -= _amount;

        // savings[_receiver] += _amount;
        payable(_receiver).transfer(_amount);
    }

    function checkBalance() external view returns (uint) {
        return address(this).balance;
    }
}
