const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'account',
        required: true,
        index: true,
        immutable: true
    },
    amount: {
        type: Number,
        required: [true,"Ledger amount is required"],
        immutable: true
    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'transaction',
        required: [true, "Transaction is required"],
        immutable: true,
        index: true
    },
    type: {
        type: String,
        enum: {
            values: ['CREDIT', 'DEBIT'],
            message: "Type must be either CREDIT or DEBIT"
        },
        required: [true, "Type is required"],
        immutable: true
    }    
});

function preventLedgerModification(){
    throw new Error("Ledger entries cannot be modified or deleted");
}

ledgerSchema.pre('remove', preventLedgerModification);
ledgerSchema.pre('deleteOne', preventLedgerModification);
ledgerSchema.pre('findOneAndDelete', preventLedgerModification);
ledgerSchema.pre('deleteMany', preventLedgerModification);
ledgerSchema.pre('updateOne', preventLedgerModification);
ledgerSchema.pre('updateMany', preventLedgerModification);
ledgerSchema.pre('findOneAndUpdate', preventLedgerModification);
ledgerSchema.pre('findOneAndReplace', preventLedgerModification);
ledgerSchema.pre('replaceOne', preventLedgerModification);

const ledgerModel = mongoose.model('ledger', ledgerSchema);


module.exports = ledgerModel;