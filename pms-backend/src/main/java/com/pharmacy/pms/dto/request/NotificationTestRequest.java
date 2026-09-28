package com.pharmacy.pms.dto.request;

import jakarta.validation.constraints.NotBlank;

public class NotificationTestRequest {

    @NotBlank(message = "Channel is required (EMAIL, SMS, TELEGRAM)")
    private String channel;

    private String recipient;
    private String message;

    public NotificationTestRequest() {}

    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }

    public String getRecipient() { return recipient; }
    public void setRecipient(String recipient) { this.recipient = recipient; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
