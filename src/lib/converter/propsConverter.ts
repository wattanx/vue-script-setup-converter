import {
  CallExpression,
  ObjectLiteralElementLike,
  ObjectLiteralExpression,
  PropertyAssignment,
  SyntaxKind,
  Node,
} from "ts-morph";
import { getNodeByKind } from "../helper";

export const convertProps = (node: CallExpression) => {
  const expression = getNodeByKind(node, SyntaxKind.ObjectLiteralExpression);

  if (!expression) {
    throw new Error("props is not found.");
  }
  if (!Node.isObjectLiteralExpression(expression)) {
    throw new Error("props is not found.");
  }

  const properties = expression
    .getProperties()
    .filter((x) => x.getKind() === SyntaxKind.PropertyAssignment);

  const propsNode = getPropsNode(properties);

  return convertToDefineProps(propsNode as PropertyAssignment);
};

const getPropsNode = (nodes: ObjectLiteralElementLike[]) => {
  const propsNode = nodes.find((x) => {
    const identifiler = (x as PropertyAssignment).getName();
    return identifiler === "props";
  });

  if (!propsNode) {
    throw new Error("props is not found.");
  }

  return propsNode;
};

const convertToDefineProps = (node: PropertyAssignment) => {
  const child = node.getInitializer();

  if (!child) {
    throw new Error("props is empty.");
  }

  if (Node.isObjectLiteralExpression(child)) {
    const properties = child.getProperties();
    const value = properties.map((x) => x.getText()).join(",");
    return `const props = defineProps({${value}})`;
  }

  return `const props = defineProps(${child.getFullText()})`;
};

// 以下 type-based declaration用
const convertPropsObject = (node: PropertyAssignment) => {
  const child = node.getInitializer();

  if (Node.isObjectLiteralExpression(child)) {
    const properties = child.getProperties();

    return properties.map((x) => {
      if (!Node.isPropertyAssignment(x)) {
        throw new Error("property not found.");
      }

      const propObj = x.getInitializer();
      if (Node.isObjectLiteralExpression(propObj)) {
        return convertPropsWithObject(propObj);
      }
      if (Node.isIdentifier(propObj)) {
        return {
          type: "typeOnly",
          typeValue: propObj.getText(),
        };
      }
    });
  }

  if (Node.isArrayLiteralExpression(child)) {
  }
};

type PropType =
  | {
      type: "array";
      propertyName: string;
    }
  | {
      type: "typeOnly";
      properties: { propertyName: string; typeValue: string };
    }
  | {
      type: "object";
      propertyName: string;
      typeValue?: string;
      required?: boolean;
      defaultValue?: string;
    };

const convertPropsWithObject = (node: ObjectLiteralExpression) => {
  const properties = node.getProperties();

  const typeValue = getPropsOption("type", properties);

  const required = getPropsOption("required", properties);

  const defaultValue = getPropsOption("default", properties);

  return {
    type: "object",
    typeValue,
    required: required ? Boolean(required) : undefined,
    defaultValue,
  };
};

const getPropsOption = (
  type: "type" | "required" | "default",
  properties: ObjectLiteralElementLike[]
) => {
  const property = properties.find((x) => {
    if (!Node.isPropertyAssignment(x)) {
      throw new Error("props property not found.");
    }
    const name = x.getName();

    return name === type;
  });

  if (!property) {
    return;
  }

  if (!Node.isPropertyAssignment(property)) {
    throw new Error("props property not found.");
  }

  if (Node.isIdentifier(property.getInitializer())) {
    return property.getInitializer()?.getText();
  } else {
    const initializer = property.getInitializer();
    if (!initializer) {
      return;
    }
    if (
      isFalseKeyword(initializer.getKind()) ||
      isTrueKeyword(initializer.getKind())
    ) {
      return isTrueKeyword(initializer.getKind());
    }
    if (Node.isLiteralLike(initializer)) {
      return initializer.getLiteralText();
    }

    return initializer.getText();
  }
};

const isTrueKeyword = (kind: SyntaxKind) => {
  return kind === SyntaxKind.TrueKeyword;
};

const isFalseKeyword = (kind: number) => {
  return kind === SyntaxKind.FalseKeyword;
};
