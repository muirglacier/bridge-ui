import { useMultiwallet } from "@renproject/multiwallet-ui";
import {
  burnMachine,
  BurnMachineContext,
  BurnMachineEvent,
  BurnMachineSchema,
  GatewaySession,
} from "@renproject/ren-tx";
import { useMachine } from "@xstate/react";
import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Interpreter, State } from "xstate";
import { env } from "../../constants/environmentVariables";
import { db } from "../../services/database/database";
import { getRenJs } from "../../services/renJs";
import { burnChainMap, releaseChainMap } from "../../services/rentx";
import { $renNetwork } from "../network/networkSlice";
import { updateTransaction } from "../transactions/transactionsSlice";
import { cloneTx } from "../transactions/transactionsUtils";

export const useBurnMachine = (burnTransaction: GatewaySession) => {
  const tx = cloneTx(burnTransaction);
  const { enabledChains } = useMultiwallet();
  const network = useSelector($renNetwork);
  const providers = Object.entries(enabledChains).reduce(
    (c, n) => ({
      ...c,
      [n[0]]: n[1].provider,
    }),
    {}
  );
  const machineHook = useMachine(burnMachine, {
    context: {
      tx,
      providers,
      sdk: getRenJs(network),
      fromChainMap: burnChainMap,
      toChainMap: releaseChainMap,
      // If we already have a transaction, we need to autoSubmit
      // to check the tx status
      autoSubmit: !!Object.values(burnTransaction.transactions)[0],
    },
    devTools: env.XSTATE_DEVTOOLS,
  });

  useReleaseTransactionPersistence(machineHook[2]);

  return machineHook;
};

export type BurnMachineSchemaState = keyof BurnMachineSchema["states"];

export const useReleaseTransactionPersistence = (
  service: Interpreter<BurnMachineContext, any, BurnMachineEvent>
) => {

};
