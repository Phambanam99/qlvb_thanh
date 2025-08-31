package com.managementcontent.model.enums;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;

/**
 * Custom deserializer for DepartmentType enum that handles both string enum
 * names
 * and numeric codes.
 */
public class DepartmentTypeDeserializer extends JsonDeserializer<DepartmentType> {

    @Override
    public DepartmentType deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String value = p.getValueAsString();

        // Try to parse as integer code first
        try {
            int code = Integer.parseInt(value);
            DepartmentType type = DepartmentType.fromCode(code);
            if (type != null) {
                return type;
            }
        } catch (NumberFormatException ignored) {
            // Not a number, try as enum name
        }

        // Try as enum name
        try {
            return DepartmentType.valueOf(value);
        } catch (IllegalArgumentException ignored) {
            // Not a valid enum name
        }

        // If we got here, neither approach worked
        throw new IllegalArgumentException(
                "Cannot deserialize value of type `DepartmentType` from String \"" + value +
                        "\": not one of the values accepted for Enum class: " +
                        "[SUBSIDIARY, ADMINISTRATIVE, PROFESSIONAL, LEADERSHIP, SUPPORT]");
    }
}