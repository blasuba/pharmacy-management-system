package com.pharmacy.pms.dto.response;

import java.util.Map;

public class SystemInfoResponse {
    private String appVersion;
    private String javaVersion;
    private String springBootVersion;
    private long uptimeSeconds;
    private String databaseEngine;
    private long totalMemoryMb;
    private long freeMemoryMb;
    private long maxMemoryMb;
    private String osName;
    private Map<String, Object> details;

    public SystemInfoResponse() {}

    public String getAppVersion() { return appVersion; }
    public void setAppVersion(String appVersion) { this.appVersion = appVersion; }
    public String getJavaVersion() { return javaVersion; }
    public void setJavaVersion(String javaVersion) { this.javaVersion = javaVersion; }
    public String getSpringBootVersion() { return springBootVersion; }
    public void setSpringBootVersion(String springBootVersion) { this.springBootVersion = springBootVersion; }
    public long getUptimeSeconds() { return uptimeSeconds; }
    public void setUptimeSeconds(long uptimeSeconds) { this.uptimeSeconds = uptimeSeconds; }
    public String getDatabaseEngine() { return databaseEngine; }
    public void setDatabaseEngine(String databaseEngine) { this.databaseEngine = databaseEngine; }
    public long getTotalMemoryMb() { return totalMemoryMb; }
    public void setTotalMemoryMb(long totalMemoryMb) { this.totalMemoryMb = totalMemoryMb; }
    public long getFreeMemoryMb() { return freeMemoryMb; }
    public void setFreeMemoryMb(long freeMemoryMb) { this.freeMemoryMb = freeMemoryMb; }
    public long getMaxMemoryMb() { return maxMemoryMb; }
    public void setMaxMemoryMb(long maxMemoryMb) { this.maxMemoryMb = maxMemoryMb; }
    public String getOsName() { return osName; }
    public void setOsName(String osName) { this.osName = osName; }
    public Map<String, Object> getDetails() { return details; }
    public void setDetails(Map<String, Object> details) { this.details = details; }
}
