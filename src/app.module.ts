import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import AssistantController from './controllers/AssistantController';
import AssistantService from './services/AssistantService';
import { CacheModule } from '@nestjs/cache-manager';
import OpenAIService from './services/OpenAIService';
import ThreadService from './services/ThreadService';
import DialogService from './services/DialogService';
import DialogController from './controllers/DialogController';
import ToolFnService from './services/ToolFnService';
import TelegramService from './services/TelegramService';

@Module({
  imports: [ConfigModule.forRoot(), CacheModule.register()],
  controllers: [AssistantController, DialogController],
  providers: [AssistantService, OpenAIService, ThreadService, DialogService, ToolFnService, TelegramService],
})
export class AppModule {}
