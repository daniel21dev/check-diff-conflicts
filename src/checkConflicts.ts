import { exec as execCb } from "child_process";
import { promisify } from "util";

const exec = promisify(execCb);

async function runDiff(file1: string, file2: string): Promise<string> {
  try {
    const command = `diff -u <(cat <<<"${file1}") <(cat <<<"${file2}")`;
    console.log(command);

    const { stdout } = await exec(command, { shell: "/bin/bash" });
    return stdout;
  } catch (error: any) {
    if (error.stdout) {
      return error.stdout as string;
    }
    throw error;
  }
}

const writeHelperComments = async (fileString: string) => {
  const lines = fileString.split("\n");
  const index = lines.findIndex((line) => line.includes("@@"));
  const conflictedFile = lines.slice(index + 1, lines.length);

  const fileToSolveLines: string[] = [];
  let currentIndex = 0;

  while (currentIndex < conflictedFile.length) {
    const currentLine = conflictedFile[currentIndex];

    // there is no conflict
    if (!currentLine.startsWith("+") && !currentLine.startsWith("-")) {
      fileToSolveLines.push(currentLine);
      currentIndex++;
      continue;
    }

    // there is no conflict
    if (currentLine.startsWith("+")) {
      fileToSolveLines.push(currentLine.slice(1, currentLine.length));
      currentIndex++;
      continue;
    }

    // there are changes
    if (currentLine.startsWith("-")) {
      const firstMinus = currentIndex;
      let isConflict = false;

      while (conflictedFile[currentIndex].startsWith("-")) {
        currentIndex++;
      }

      if (conflictedFile[currentIndex].startsWith("+")) {
        isConflict = true;
      }

      // there is no conflict
      if (!isConflict) {
        fileToSolveLines.push(
          ...conflictedFile
            .slice(firstMinus, currentIndex)
            .map((line) => line.slice(1, line.length))
        );
        continue;
      }

      // there is a conflict
      // add the first part of the conflict
      fileToSolveLines.push("<<<<<<< HEAD");
      fileToSolveLines.push(
        ...conflictedFile
          .slice(firstMinus, currentIndex)
          .map((line) => line.slice(1, line.length))
      );
      fileToSolveLines.push("=======");
      // add the second part of the conflict
      while (conflictedFile[currentIndex].startsWith("+")) {
        fileToSolveLines.push(
          conflictedFile[currentIndex].slice(
            1,
            conflictedFile[currentIndex].length
          )
        );
        currentIndex++;
      }
      // add the end of the conflict
      fileToSolveLines.push(">>>>>>>");
    }
  }

  return fileToSolveLines.join("\n");
};

/*
 * @param {string} file1
 * @param {string} file2 string
 * @returns string
 */
export const checkConflicts = async (
  file1: string,
  file2: string
): Promise<string> => {
  const diff = await runDiff(file1, file2);
  const fileToSolve = await writeHelperComments(diff);
  return fileToSolve;
};
