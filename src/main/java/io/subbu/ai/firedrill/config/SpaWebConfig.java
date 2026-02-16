package io.subbu.ai.firedrill.config;

import org.springframework.boot.web.server.ErrorPage;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.boot.web.servlet.server.ConfigurableServletWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Configuration for SPA (Single Page Application) routing.
 * Forwards 404 errors to index.html for client-side routing.
 */
@Configuration
public class SpaWebConfig {

    @Bean
    public WebServerFactoryCustomizer<ConfigurableServletWebServerFactory> containerCustomizer() {
        return container -> {
            container.addErrorPages(new ErrorPage(HttpStatus.NOT_FOUND, "/notFound"));
        };
    }

    @Controller
    public static class SpaViewController {
        @RequestMapping("/notFound")
        public String forward() {
            return "forward:/index.html";
        }
    }
}
