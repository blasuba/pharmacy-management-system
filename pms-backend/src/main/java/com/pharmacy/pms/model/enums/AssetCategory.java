package com.pharmacy.pms.model.enums;

public enum AssetCategory {
    LAPTOP("LAP"),
    DESKTOP("DSK"),
    FURNITURE("FUR"),
    REFRIGERATOR("REF"),
    AC("ACU"),
    POS_TERMINAL("POS"),
    GENERATOR("GEN"),
    SECURITY_CAMERA("CAM"),
    OTHER("AST");

    private final String codePrefix;

    AssetCategory(String codePrefix) {
        this.codePrefix = codePrefix;
    }

    public String getCodePrefix() {
        return codePrefix;
    }
}
