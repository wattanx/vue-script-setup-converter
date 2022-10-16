import { ScriptTarget } from "ts-morph";
import ts, { factory, Identifier, SyntaxKind } from "typescript";
import { Project } from "ts-morph";
import { parse } from "@vue/compiler-sfc";
import { getNodeByKind } from "./helper";

export const convertSrc = (input: string) => {
  const {
    descriptor: { script, scriptSetup },
  } = parse(input);

  const sourceFile = ts.createSourceFile(
    "src.tsx",
    script?.content ?? "",
    ts.ScriptTarget.Latest
  );

  const callexpression = getNodeByKind(sourceFile, SyntaxKind.CallExpression);
  if (!callexpression) {
    return;
  }
  if (!ts.isCallExpression(callexpression)) {
    return;
  }

  if (!isDefineComponent(callexpression)) {
    return;
  }

  const propsNode = convertProps(callexpression, sourceFile);

  const setupNode = getNodeByKind(sourceFile, SyntaxKind.MethodDeclaration);

  if (!setupNode) {
    throw new Error("setup is not found.");
  }

  const blockNode = getNodeByKind(setupNode, SyntaxKind.Block);

  if (!blockNode) {
    return;
  }

  if (!ts.isBlock(blockNode)) {
    return;
  }

  const statements = blockNode.statements;

  const filterdStatements = statements.filter(
    (x) => x.kind !== SyntaxKind.ReturnStatement
  );

  const newSrc = factory.createSourceFile(
    filterdStatements,
    sourceFile.endOfFileToken,
    sourceFile.flags
  );

  const printer = ts.createPrinter();

  return printer.printFile(newSrc);
};

export const getPropsNode = (nodes: ts.Node[]) => {
  const propsNode = nodes.find((x) => {
    const identifiler = (x as ts.PropertyAssignment).name;
    if (!ts.isIdentifier(identifiler)) {
      return false;
    }
    return identifiler.escapedText === "props";
  });

  if (!propsNode) {
    throw new Error("props is not found.");
  }

  return propsNode;
};

export const isDefineComponent = (node: ts.CallExpression) => {
  if (!ts.isIdentifier(node.expression)) {
    return false;
  }

  return node.expression.escapedText === "defineComponent";
};

type PropType =
  | {
      type: "array";
    }
  | {
      type: "typeOnly";
      typeValue: string;
    }
  | {
      type: "object";
      typeValue?: string;
      required?: boolean;
      defaultValue?: string;
    };

export const convertProps = (
  node: ts.CallExpression,
  sourceFile: ts.SourceFile
) => {
  const expression = getNodeByKind(node, SyntaxKind.ObjectLiteralExpression);

  if (!expression) {
    throw new Error("props is not found.");
  }
  if (!ts.isObjectLiteralExpression(expression)) {
    throw new Error("props is not found.");
  }

  const properties = expression.properties.filter(
    (x) => x.kind === SyntaxKind.PropertyAssignment
  );

  const propsNode = getPropsNode(properties);

  const obj = convertPropsObject(
    propsNode as ts.PropertyAssignment,
    sourceFile
  );

  return getPropsNode(properties);
};

const convertPropsObject = (
  node: ts.PropertyAssignment,
  sourceFile: ts.SourceFile
) => {
  const child = node.initializer;
  if (ts.isObjectLiteralExpression(child)) {
    const properties = child.properties;
    return properties.map((x) => {
      if (!ts.isPropertyAssignment(x)) {
        throw new Error("property not found.");
      }

      const propObj = x.initializer;
      if (ts.isObjectLiteralExpression(propObj)) {
        return convertPropsWithObject(propObj, sourceFile);
      }
      if (ts.isIdentifier(propObj)) {
        return {
          type: "typeOnly",
          typeValue: propObj.escapedText,
        };
      }
    });
  }

  if (ts.isArrayLiteralExpression(child)) {
  }
};

const convertPropsWithObject = (
  node: ts.ObjectLiteralExpression,
  sourceFile: ts.SourceFile
) => {
  const properties = node.properties;

  const typeValue = getPropsOption("type", properties, sourceFile);

  const required = getPropsOption("required", properties, sourceFile);

  const defaultValue = getPropsOption("default", properties, sourceFile);

  return {
    type: "object",
    typeValue,
    required: required ? Boolean(required) : undefined,
    defaultValue,
  };
};

const getPropsOption = (
  type: "type" | "required" | "default",
  properties: ts.NodeArray<ts.ObjectLiteralElementLike>,
  sourceFile: ts.SourceFile
) => {
  const property = properties.find((x) => {
    if (!ts.isPropertyAssignment(x)) {
      throw new Error("props property not found.");
    }
    const name = x.name as Identifier;

    return name.escapedText === type;
  });

  if (!property) {
    return;
  }

  if (!ts.isPropertyAssignment(property)) {
    throw new Error("props property not found.");
  }

  if (ts.isIdentifier(property.initializer)) {
    return property.initializer.escapedText.toString();
  } else {
    if (
      isFalseKeyword(property.initializer.kind) ||
      isTrueKeyword(property.initializer.kind)
    ) {
      return isTrueKeyword(property.initializer.kind);
    }
    return property.initializer.getText(sourceFile).toString();
  }
};

const isTrueKeyword = (kind: number) => {
  return kind === 110;
};

const isFalseKeyword = (kind: number) => {
  return kind === 95;
};
