import {
  ChildProcess,
  ExecException,
  execFile,
  ExecFileOptionsWithBufferEncoding,
  spawn,
} from "child_process";
import * as os from "os";

const currentlyRunningChildProcesses = new Set<ChildProcess>();

export function execShell(
  file: string,
  args: readonly string[] | null | undefined,
  options: ExecFileOptionsWithBufferEncoding,
  callback: (
    error: ExecException | null,
    stdout: Buffer,
    stderr: Buffer
  ) => void
): ChildProcess {
  let process: ChildProcess;
  function processHandler(
    error: any | ExecException | null,
    stdout: string | any,
    stderr: Buffer
  ) {
    currentlyRunningChildProcesses.delete(process);
    callback(error, stdout, stderr);
  }

  if (os.platform() === "win32") {
    const spawnProcess = spawn(file, args ?? [], { ...options, shell: true });
    process = spawnProcess;
    spawnProcess.on("error", (error) => {
      currentlyRunningChildProcesses.delete(process);
      processHandler(
        error,
        spawnProcess.stdout,
        Buffer.from(spawnProcess.stderr)
      );
    });
    spawnProcess.on("close", () => {
      processHandler(
        null,
        spawnProcess.stdout,
        Buffer.from(spawnProcess.stderr)
      );
    });
  } else {
    process = execFile(file, args, options, processHandler);
  }
  currentlyRunningChildProcesses.add(process);
  return process;
}

export function killAllChildProcesses() {
  for (const child of currentlyRunningChildProcesses) {
    child.kill();
  }
}
