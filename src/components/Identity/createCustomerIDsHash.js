const serializeCustomerIDs = customerIDs => {
  return Object.keys(customerIDs)
    .reduce((serialized, customerID) => {
      return `${serialized}${customerID}|${customerIDs[customerID].ID}${
        customerIDs[customerID].authState
      }|`;
    }, "")
    .slice(0, -1);
};

const createHashFromString = string => {
  return [...string].reduce((hash, char) => {
    return ((hash << 5) - hash + char) & hash; // eslint-disable-line no-bitwise
  }, 0);
};
export default customerIDs => {
  return createHashFromString(serializeCustomerIDs(customerIDs));
};
