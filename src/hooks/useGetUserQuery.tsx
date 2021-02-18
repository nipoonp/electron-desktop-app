import { GET_USER, IGET_USER } from "../graphql/customQueries";
import { useQuery } from "react-apollo-hooks";
import { useEffect, useState } from "react";

export const useGetUserQuery = (userID: string | null) => {
  const [data, setSavedData] = useState<IGET_USER | null>(null);
  const { data: _data, error, loading, refetch, networkStatus } = useQuery(
    GET_USER,
    {
      variables: {
        userID: userID
      },
      skip: !userID,
      fetchPolicy: "network-only",
      notifyOnNetworkStatusChange: true
    }
  );

  // pass saved data down when refetching instead of null
  useEffect(() => {
    if (_data) {
      setSavedData(_data.getUser);
    }
  }, [_data]);

  const refetching = networkStatus === 4;

  return {
    user: data,
    error,
    loading,
    refetch,
    refetching
  };
};
