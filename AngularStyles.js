import { Component } from '@angular/core';

@Component({
  template: `
    <div class="angular-styles">
      <div class="title">{{ pageTitle }}</div>
      <div class="menu">
        <div class="cutout-circle"></div>

        <!-- Menu items -->
        <ul>
          <li class="menu-item">
            <div class="slider"></div>
            <div class="slider-red slider"></div>
            <div class="slider-green slider"></div>
            <div class="slider-blue slider"></div>
            <div class="slider-label">Slider Label</div>
            <div class="color-label">Color Label</div>
          </li>
          <!-- Add more menu items as needed -->
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .angular-styles {
      text-align: center;
      font-family: 'Ubuntu', sans-serif;
    }

    .title {
      color: #333;
    }

    .menu {
      background-color: #333;
      color: #fff;
      padding: 10px;
      margin-top: 120px;
      border-radius: 20px;
      overflow: hidden;
      position: relative;
    }

    .cutout-circle {
      width: 220px;
      height: 220px;
      background-color: #333;
      border-radius: 50%;
      position: absolute;
      left: 120px;
      top: 41%;
      transform: translateY(-50%);
      box-shadow: 0 0 20px rgba(255, 255, 255, 1.4);
    }

    /* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ menu items +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
    .menu ul {
      list-style-type: none;
      padding: 0;
    }

    .menu li {
      margin-bottom: 55px;
    }

    .menu-item {
      text-align: right;
      position: relative;
    }

    .slider {
      width: 40%;
      margin-top: 15px;
    }

    /* Specific class names for color sliders */
    .slider-red,
    .slider-green,
    .slider-blue {
      width: 50%;
      margin-top: 10px;
      position: absolute;
      left: 0;
      top: 100%;
      display: block;
    }

    .menu-item .slider-label {
      text-align: center;
      margin-right: -330px;
    }

    .menu-item .color-label {
      text-align: right;
      margin-right: 196px;
    }
  `],
})
export class AngularStylesComponent {
  pageTitle = 'Angular Styles';
}
