import CounterModel from "@/models/Counter";
import dbConnect from "@/lib/dbConnect";

export const getNextSequence = async (
  sequenceName: string
): Promise<number> => {
  // Connect to the database
  await dbConnect();

  const counter = await CounterModel.findByIdAndUpdate(
    sequenceName,
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence_value;
};

// This function retrieves the next sequence number for a given sequence name from the Counter collection in MongoDB.
// It uses the findByIdAndUpdate method to increment the sequence_value by 1 and return the updated value.
// If the sequence name does not exist, it creates a new document with the initial sequence_value set to 1.
// The upsert option ensures that a new document is created if it doesn't already exist.
// The function returns the next sequence number as a Promise<number>.
// This is useful for generating unique identifiers or order numbers in applications where sequential numbering is required.
