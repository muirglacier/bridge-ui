import { useMultiwallet } from "@renproject/multiwallet-ui";
import {
  DepositMachineSchema,
  GatewayMachineContext,
  GatewayMachineEvent,
  GatewaySession,
  mintMachine,
} from "@renproject/ren-tx";
import { useMachine } from "@xstate/react";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Interpreter, State } from "xstate";
import { env } from "../../constants/environmentVariables";
import { db } from "../../services/database/database";
import { getRenJs } from "../../services/renJs";
import { lockChainMap, mintChainMap } from "../../services/rentx";
import { $renNetwork } from "../network/networkSlice";
import { updateTransaction } from "../transactions/transactionsSlice";
import { cloneTx } from "../transactions/transactionsUtils";
import { depositSorter } from "./mintUtils";

export const useMintMachine = (mintTransaction: GatewaySession) => {
  const tx = cloneTx(mintTransaction);
  const { enabledChains } = useMultiwallet();
  const network = useSelector($renNetwork);
  const providers = Object.entries(enabledChains).reduce(
    (c, n) => ({
      ...c,
      [n[0]]: n[1].provider,
    }),
    {}
  );
  const machineHook = useMachine(mintMachine, {
    context: {
      tx,
      providers,
      sdk: getRenJs(network),
      fromChainMap: lockChainMap,
      toChainMap: mintChainMap,
    },
    devTools: env.XSTATE_DEVTOOLS,
  });

  return machineHook;
};

export type DepositMachineSchemaState = keyof DepositMachineSchema["states"];



export const useDepositPagination = (
  tx: GatewaySession,
  depositSourceHash = "",
  updateHash: (arg0: string) => void
) => {
  const sortedDeposits = tx.transactions;
  const orderedHashes = Object.keys(sortedDeposits).map((deposit) => deposit);

  const total = orderedHashes.length;
  const initial = depositSourceHash || total > 0 ? orderedHashes[0] : "";
  const [currentHash, setCurrentHash] = useState(initial);
  useEffect(() => {
    setCurrentHash(initial);
  }, [initial]);

  const currentIndex = orderedHashes.indexOf(currentHash);
  const nextIndex =
    total > 0 && currentIndex + 1 < total ? currentIndex + 1 : 0;
  const nextHash = orderedHashes[nextIndex];
  const prevIndex = total > 0 && currentIndex - 1 >= 0 ? currentIndex - 1 : 0;
  const prevHash = orderedHashes[prevIndex];

  const handleNext = useCallback(() => {
    console.log(orderedHashes)
    console.log("next:",nextHash)
    setCurrentHash(nextHash);
    updateHash(nextHash)
  }, [nextHash]);

  const handlePrev = useCallback(() => {
    console.log("prev:",prevHash)
    setCurrentHash(prevHash);
    updateHash(prevHash)
  }, [prevHash]);


  return {
    currentHash,
    currentIndex,
    handleNext,
    handlePrev,
    total  };
};
