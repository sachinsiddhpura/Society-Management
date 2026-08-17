package com.society.management.controller;

import com.society.management.dto.response.FileUploadResponse;
import com.society.management.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class FileUploadController {

    private final FileStorageService fileStorageService;

    @PostMapping("/photo")
    public FileUploadResponse uploadPhoto(@RequestParam("file") MultipartFile file) {
        String url = fileStorageService.storePhoto(file);
        return new FileUploadResponse(url);
    }
}
