export type WindowState = {
  screenX: number;
  screenY: number;
  width: number;
  height: number;
};

export type GlobalState = {
  current: WindowState;
  other: WindowState[];
};

export type MessageT<Action extends string, Payload extends unknown> = {
  action: Action;
  payload: Payload;
};

type WindowStateChangedPayload = {
  oldWindow?: WindowState;
  newWindow: WindowState;
  id: number;
};

type AttributedIdPayload = {
  id: number;
};

type WindowUnloadedPayload = {
  id: number;
};

export type WorkerMessage =
  | MessageT<"connected", { state: WindowState }>
  | MessageT<"sync", { allWindows: { windowState: WindowState; id: number }[] }>
  | MessageT<"windowStateChanged", WindowStateChangedPayload>
  | MessageT<"attributedId", AttributedIdPayload>
  | MessageT<"windowUnloaded", WindowUnloadedPayload>;


// worker.ts 
let windows: { windowState: WindowState; id: number; port: MessagePort }[] = [];


self.onconnect = ({ ports }) => {
  const port = ports[0];

  port.onmessage = function (event: MessageEvent<WorkerMessage>) {
    const msg = event.data;

    switch (msg.action) {
      case "windowStateChanged": {
        const { id, newWindow } = msg.payload;
        const oldWindowIndex = windows.findIndex((w) => w.id === id);
        if (oldWindowIndex !== -1) {
          // old one changed
          windows[oldWindowIndex].windowState = newWindow;
        } else {
          // new window 
          windows.push({ id, windowState: newWindow, port });
        }

        console.log('windows', windows);
        
        windows.forEach((w) =>
          // send sync here 
          w.port.postMessage({
            action: "sync",
            payload: { 
              allWindows: JSON.parse(JSON.stringify(windows)) 
            },
          } satisfies WorkerMessage)
        );
        break;
      }
    }
  };
};